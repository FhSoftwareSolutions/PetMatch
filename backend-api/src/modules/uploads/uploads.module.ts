import { Module } from '@nestjs/common';

import { UploadsController } from './uploads.controller';

/** Upload de imagens (fotos de pets), gravadas em disco e servidas em /uploads. */
@Module({
  controllers: [UploadsController],
})
export class UploadsModule {}
