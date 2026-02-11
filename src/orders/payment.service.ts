import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from 'src/database-backup/supabase.service';
import { CreatePaymentDto } from './dto/createPayment.dto';
import { PaymentMethod, Status } from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly BUCKET_NAME = 'comprobantes';
  private readonly SIGNED_URL_EXPIRY = 3600; // 1 hora en segundos

  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) { }

  async createPayment(createPaymentDto: CreatePaymentDto) {
    const { orderId, method, reference, proofBase64 } = createPaymentDto;

    try {
      // Verificar que la orden existe
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true }
      });

      if (!order) {
        throw new NotFoundException(`Orden con ID ${orderId} no encontrada`);
      }

      let proofUrl: string | null = null;
      let fileName: string | null = null;

      // IMPORTANTE: Solo subir comprobante si viene proofBase64
      // Si no viene, NO lo subimos, se subirá después
      if (proofBase64) {
        fileName = await this.uploadBase64Image(orderId, proofBase64);
        proofUrl = await this.generateSignedUrl(fileName);
      }

      // Crear el pago en la base de datos (puede estar sin comprobante)
      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          method,
          reference,
          proofUrl,
          fileName,
          status: Status.PENDING,
        },
      });

      this.logger.log(`Pago creado para orden #${orderId} (con comprobante: ${!!proofBase64})`);

      return payment;
    } catch (error) {
      this.logger.error('Error creando pago:', error);
      throw error;
    }
  }

  async uploadPaymentProof(orderId: number, file: Express.Multer.File) {
  try {
    console.log('🔄 Iniciando subida de comprobante para orden:', orderId);
    console.log('📄 Archivo recibido:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      bufferLength: file.buffer?.length
    });

    // Verificar que la orden existe
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      console.error('❌ Orden no encontrada:', orderId);
      throw new NotFoundException(`Orden con ID ${orderId} no encontrada`);
    }

    console.log('✅ Orden encontrada:', order.id);

    // Subir archivo a Supabase
    const fileName = `comprobante-orden-${orderId}-${Date.now()}-${file.originalname}`;
    console.log('📤 Subiendo a Supabase con nombre:', fileName);
    
    const { data, error } = await this.supabase.client.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('❌ Error de Supabase:', error);
      throw new BadRequestException(`Error subiendo archivo: ${error.message}`);
    }

    console.log('✅ Archivo subido a Supabase:', data);

    // Generar URL firmada
    const signedUrl = await this.generateSignedUrl(fileName);
    console.log('🔗 URL firmada generada:', signedUrl);

    // Buscar el pago existente para esta orden
    const existingPayment = await this.prisma.payment.findFirst({
      where: { orderId },
    });

    if (existingPayment) {
      console.log('📝 Actualizando pago existente:', existingPayment.id);
      // Actualizar el pago existente
      const updatedPayment = await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: { 
          proofUrl: signedUrl,
          fileName
        },
      });

      console.log('✅ Pago actualizado:', updatedPayment.id);
      return { 
        success: true, 
        proofUrl: signedUrl,
        fileName,
        message: 'Comprobante actualizado exitosamente'
      };
    }

    // Si no existe pago, crear uno nuevo
    console.log('📝 Creando nuevo pago...');
    const newPayment = await this.prisma.payment.create({
      data: {
        orderId,
        method: PaymentMethod.EFECTIVO,
        proofUrl: signedUrl,
        fileName,
        status: Status.PENDING,
      },
    });

    console.log('✅ Nuevo pago creado:', newPayment.id);
    return { 
      success: true, 
      proofUrl: signedUrl,
      fileName,
      message: 'Comprobante subido exitosamente'
    };
  } catch (error) {
    console.error('🔥 Error en uploadPaymentProof:', error);
    this.logger.error('Error subiendo comprobante:', error);
    throw error;
  }
}

  async getPaymentProof(orderId: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId },
      orderBy: { paymentDate: 'desc' }
    });

    if (!payment) {
      throw new NotFoundException(`No se encontró pago para la orden #${orderId}`);
    }

    // Si no hay comprobante, retornar null
    if (!payment.fileName) {
      return null;
    }

    // Generar nueva URL firmada (porque las anteriores expiran)
    try {
      const signedUrl = await this.generateSignedUrl(payment.fileName);
      return signedUrl;
    } catch (error) {
      this.logger.error(`Error generando URL firmada para ${payment.fileName}:`, error);
      // Si no podemos generar una nueva URL, retornar la que tenemos (puede estar expirada)
      return payment.proofUrl;
    }
  }

  async getPaymentDetails(orderId: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId },
      orderBy: { paymentDate: 'desc' }
    });

    if (!payment) {
      throw new NotFoundException(`No se encontró pago para la orden #${orderId}`);
    }

    // Generar nueva URL firmada si hay archivo
    let currentSignedUrl = null;
    if (payment.fileName) {
      try {
        currentSignedUrl = await this.generateSignedUrl(payment.fileName);
      } catch (error) {
        this.logger.error(`Error generando URL firmada: ${error.message}`);
      }
    }

    return {
      ...payment,
      currentSignedUrl, // URL firmada actual (fresca)
      hasProof: !!payment.fileName,
    };
  }

  private async uploadBase64Image(orderId: number, base64String: string): Promise<string> {
    try {
      // Extraer el tipo MIME y los datos base64
      const matches = base64String.match(/^data:(.+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new BadRequestException('Formato base64 inválido');
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Determinar extensión del archivo
      const extension = mimeType.split('/')[1] || 'png';
      const fileName = `comprobante-orden-${orderId}-${Date.now()}.${extension}`;

      // Subir a Supabase
      const { data, error } = await this.supabase.client.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, buffer, {
          contentType: mimeType,
        });

      if (error) {
        throw new BadRequestException(`Error subiendo imagen: ${error.message}`);
      }

      return fileName;
    } catch (error) {
      this.logger.error('Error subiendo imagen base64:', error);
      throw error;
    }
  }

  private async generateSignedUrl(fileName: string): Promise<string> {
    try {
      const { data, error } = await this.supabase.client.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(fileName, this.SIGNED_URL_EXPIRY);

      if (error) {
        throw new BadRequestException(`Error generando URL firmada: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      this.logger.error('Error generando URL firmada:', error);
      throw error;
    }
  }
}