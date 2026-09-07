import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('reports ok with a timestamp', () => {
      const result = appController.health();
      expect(result.status).toBe('ok');
      expect(Date.parse(result.timestamp)).not.toBeNaN();
    });
  });
});
