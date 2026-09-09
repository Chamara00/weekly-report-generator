import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReviewAction } from '@prisma/client';
import { ReviewReportDto } from './review-report.dto';

// The "you must say why" rule, tested at the layer that enforces it.
async function check(payload: Record<string, unknown>) {
  const dto = plainToInstance(ReviewReportDto, payload);
  const errors = await validate(dto);

  return {
    valid: errors.length === 0,
    messages: errors.flatMap((error) => Object.values(error.constraints ?? {})),
  };
}

describe('ReviewReportDto', () => {
  describe('REQUEST_CHANGES requires a comment', () => {
    it('rejects an empty string', async () => {
      const result = await check({
        action: ReviewAction.REQUEST_CHANGES,
        comment: '',
      });

      expect(result.valid).toBe(false);
      expect(result.messages).toContain(
        'comment is required when requesting changes',
      );
    });

    it('rejects a whitespace-only comment', async () => {
      const result = await check({
        action: ReviewAction.REQUEST_CHANGES,
        comment: '   ',
      });

      expect(result.valid).toBe(false);
      expect(result.messages).toContain(
        'comment is required when requesting changes',
      );
    });

    it('rejects an omitted comment', async () => {
      const result = await check({ action: ReviewAction.REQUEST_CHANGES });

      expect(result.valid).toBe(false);
      expect(result.messages).toContain(
        'comment is required when requesting changes',
      );
    });

    it('accepts a real comment', async () => {
      const result = await check({
        action: ReviewAction.REQUEST_CHANGES,
        comment: 'Please add the actual hours spent.',
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('APPROVE', () => {
    it('accepts no comment at all', async () => {
      const result = await check({ action: ReviewAction.APPROVE });

      expect(result.valid).toBe(true);
    });

    it('accepts an optional comment', async () => {
      const result = await check({
        action: ReviewAction.APPROVE,
        comment: 'Nice work.',
      });

      expect(result.valid).toBe(true);
    });
  });

  it('rejects an unknown action', async () => {
    const result = await check({ action: 'DELETE_IT' });

    expect(result.valid).toBe(false);
  });
});
