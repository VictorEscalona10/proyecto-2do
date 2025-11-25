import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private loggingEnabled = true;

  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.wrapModelsWithLogging();
  }

  /**
   * Envolver los métodos de los modelos para agregar logging automático
   */
  private wrapModelsWithLogging() {
    const models = Object.keys(this).filter(
      (key) => typeof (this as any)[key] === 'object' && (this as any)[key]?.create
    );

    models.forEach((modelName) => {
      if (modelName === 'dbLog') return; // No loguear DbLog para evitar recursión

      const model = (this as any)[modelName];

      // Wrap create
      if (model.create) {
        const originalCreate = model.create.bind(model);
        model.create = async (args: any) => {
          const result = await originalCreate(args);
          await this.logOperation('CREATE', modelName, result?.id);
          return result;
        };
      }

      // Wrap createMany
      if (model.createMany) {
        const originalCreateMany = model.createMany.bind(model);
        model.createMany = async (args: any) => {
          const result = await originalCreateMany(args);
          await this.logOperation('CREATE', modelName, null);
          return result;
        };
      }

      // Wrap update
      if (model.update) {
        const originalUpdate = model.update.bind(model);
        model.update = async (args: any) => {
          const recordId = args.where?.id;
          const result = await originalUpdate(args);
          await this.logOperation('UPDATE', modelName, recordId || result?.id);
          return result;
        };
      }

      // Wrap updateMany
      if (model.updateMany) {
        const originalUpdateMany = model.updateMany.bind(model);
        model.updateMany = async (args: any) => {
          const result = await originalUpdateMany(args);
          await this.logOperation('UPDATE', modelName, null);
          return result;
        };
      }

      // Wrap delete
      if (model.delete) {
        const originalDelete = model.delete.bind(model);
        model.delete = async (args: any) => {
          const recordId = args.where?.id;
          const result = await originalDelete(args);
          await this.logOperation('DELETE', modelName, recordId);
          return result;
        };
      }

      // Wrap deleteMany
      if (model.deleteMany) {
        const originalDeleteMany = model.deleteMany.bind(model);
        model.deleteMany = async (args: any) => {
          const result = await originalDeleteMany(args);
          await this.logOperation('DELETE', modelName, null);
          return result;
        };
      }
    });
  }

  /**
   * Registrar operación en la base de datos
   */
  private async logOperation(action: string, tableName: string, recordId?: number | null) {
    if (!this.loggingEnabled) return;

    try {
      // Temporarily disable logging to avoid recursion
      this.loggingEnabled = false;

      await this.dbLog.create({
        data: {
          action,
          tableName: this.capitalizeFirstLetter(tableName),
          recordId,
          description: `${action} operation on ${this.capitalizeFirstLetter(tableName)}`,
        },
      });
    } catch (error) {
      console.error('Error logging database operation:', error);
    } finally {
      this.loggingEnabled = true;
    }
  }

  /**
   * Capitalizar primera letra para nombres de modelo
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

