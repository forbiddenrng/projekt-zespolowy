import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from 'src/database/database.module';
import { UserFromHeaderMiddleware } from 'src/middleware/user-from-header.middleware';
import { WorkExperienceController } from './work-experience.controller';
import { EducationController } from './education.controller';
import { LinksController } from './links.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [
    WorkExperienceController,
    EducationController,
    LinksController,
    UsersController,
  ],
  providers: [UsersService],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserFromHeaderMiddleware).forRoutes('users');
  }
}
