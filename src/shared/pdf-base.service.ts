import * as PDFDocument from 'pdfkit';

export interface TableColumn {
    header: string;
    key: string;
    width: number;
}

export abstract class PdfBaseService {
    /**
     * Crear encabezado del documento
     */
    protected addHeader(
        doc: PDFKit.PDFDocument,
        title: string,
        subtitle?: string,
    ): void {
        doc
            .fontSize(20)
            .fillColor('#2c3e50')
            .text(title, { align: 'center' })
            .moveDown(0.3);

        if (subtitle) {
            doc
                .fontSize(12)
                .fillColor('#7f8c8d')
                .text(subtitle, { align: 'center' })
                .moveDown(0.5);
        }

        // Línea separadora
        doc
            .moveTo(50, doc.y)
            .lineTo(550, doc.y)
            .strokeColor('#3498db')
            .lineWidth(2)
            .stroke();
        doc.moveDown();
    }

    /**
     * Agregar información de generación
     */
    protected addGenerationInfo(doc: PDFKit.PDFDocument): void {
        const now = new Date();
        doc
            .fontSize(10)
            .fillColor('#95a5a6')
            .text(
                `Generado el: ${now.toLocaleDateString('es-ES')} a las ${now.toLocaleTimeString('es-ES')}`,
                { align: 'right' },
            )
            .moveDown();
    }

    /**
     * Agregar pie de página
     */
    protected addFooter(doc: PDFKit.PDFDocument, pageNumber: number): void {
        doc
            .fontSize(10)
            .fillColor('#95a5a6')
            .text(
                `Migdalis Tortas - Sistema de Gestión | Página ${pageNumber}`,
                50,
                doc.page.height - 50,
                { align: 'center' },
            );
    }

    /**
     * Crear una sección con título
     */
    protected addSection(doc: PDFKit.PDFDocument, title: string): void {
        doc
            .fontSize(14)
            .fillColor('#2c3e50')
            .text(title, { underline: true })
            .moveDown(0.5);
    }

    /**
     * Agregar estadísticas en formato clave-valor
     */
    protected addStatistics(
        doc: PDFKit.PDFDocument,
        stats: Record<string, string | number>,
    ): void {
        doc.fontSize(11).fillColor('#34495e');

        Object.entries(stats).forEach(([key, value]) => {
            doc.text(`${key}: `, { continued: true });
            doc.fillColor('black').text(String(value));
            doc.fillColor('#34495e');
        });

        doc.moveDown();
    }

    /**
     * Crear tabla simple
     */
    protected addTable(
        doc: PDFKit.PDFDocument,
        columns: TableColumn[],
        rows: any[],
    ): void {
        const startX = 50;
        let startY = doc.y;
        const rowHeight = 25;
        const headerHeight = 30;

        // Calcular ancho total
        const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);

        // Dibujar encabezados
        doc.fontSize(10).fillColor('white');

        let currentX = startX;
        columns.forEach((col) => {
            doc
                .rect(currentX, startY, col.width, headerHeight)
                .fill('#3498db')
                .fillColor('white')
                .text(col.header, currentX + 5, startY + 8, {
                    width: col.width - 10,
                    align: 'left',
                });
            currentX += col.width;
        });

        startY += headerHeight;

        // Dibujar filas
        doc.fillColor('black').fontSize(9);

        rows.forEach((row, index) => {
            // Alternar colores de fila
            const bgColor = index % 2 === 0 ? '#ecf0f1' : 'white';

            currentX = startX;
            columns.forEach((col) => {
                const value = this.getNestedValue(row, col.key);
                doc
                    .rect(currentX, startY, col.width, rowHeight)
                    .fill(bgColor)
                    .fillColor('black')
                    .text(String(value || '-'), currentX + 5, startY + 8, {
                        width: col.width - 10,
                        align: 'left',
                    });
                currentX += col.width;
            });

            startY += rowHeight;

            // Verificar si necesitamos nueva página
            if (startY > doc.page.height - 100) {
                doc.addPage();
                startY = 50;
            }
        });

        doc.moveDown();
    }

    /**
     * Obtener valor anidado de un objeto
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Crear el documento PDF y retornar un Buffer
     */
    protected createPdfBuffer(
        buildContent: (doc: PDFKit.PDFDocument) => void,
    ): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            buildContent(doc);

            doc.end();
        });
    }
}
