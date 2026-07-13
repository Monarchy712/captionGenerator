import type { FeedbackType } from "@caption-studio/shared";
import { CaptionRepository, FeedbackRepository } from "../repositories";
import { AppError } from "../utils/helpers";

export class FeedbackService {
  constructor(
    private feedbackRepo = new FeedbackRepository(),
    private captionRepo = new CaptionRepository()
  ) {}

  async submit(input: {
    captionId: string;
    type: FeedbackType;
    editedText?: string;
    note?: string;
  }) {
    const caption = await this.captionRepo.findById(input.captionId);
    if (!caption) throw new AppError(404, "Caption not found");

    let updated = caption;

    switch (input.type) {
      case "like":
      case "dislike":
        break;
      case "used":
        updated = await this.captionRepo.markUsed(input.captionId);
        break;
      case "edit": {
        if (!input.editedText?.trim()) {
          throw new AppError(400, "editedText is required for edit feedback");
        }
        // Version history: never overwrite — create a new CaptionVersion.
        updated = await this.captionRepo.applyEdit(input.captionId, input.editedText.trim());
        break;
      }
      default:
        throw new AppError(400, `Unknown feedback type: ${input.type}`);
    }

    const feedback = await this.feedbackRepo.create({
      captionId: input.captionId,
      type: input.type,
      note: input.note,
    });

    return {
      feedback: {
        id: feedback.id,
        captionId: feedback.captionId,
        type: feedback.type as FeedbackType,
        note: feedback.note,
        createdAt: feedback.createdAt.toISOString(),
      },
      caption: {
        id: updated.id,
        transcriptId: updated.transcriptId,
        originalText: updated.originalText,
        editedText: updated.editedText,
        finalText: updated.finalText,
        speaker: updated.speaker,
        style: updated.style,
        version: updated.version,
        isUsed: updated.isUsed,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  }
}
