import type { FeedbackType, GeneratedCaption } from "@caption-studio/shared";
import { CaptionRepository, FeedbackRepository } from "../repositories";
import { AppError } from "../utils/helpers";

function toCaptionDto(c: {
  id: string;
  transcriptId: string;
  originalText: string;
  editedText: string | null;
  finalText: string;
  speaker: string | null;
  style: string | null;
  outputKind?: string | null;
  version: number;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}): GeneratedCaption {
  return {
    id: c.id,
    transcriptId: c.transcriptId,
    originalText: c.originalText,
    editedText: c.editedText,
    finalText: c.finalText,
    speaker: c.speaker,
    style: c.style,
    outputKind: (c.outputKind as GeneratedCaption["outputKind"]) ?? "x_captions",
    version: c.version,
    isUsed: c.isUsed,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

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

    let updated = toCaptionDto(caption);

    switch (input.type) {
      case "like":
      case "dislike":
        break;
      case "used":
        updated = toCaptionDto(await this.captionRepo.markUsed(input.captionId));
        break;
      case "edit": {
        if (!input.editedText?.trim()) {
          throw new AppError(400, "editedText is required for edit feedback");
        }
        // Version history: never overwrite — create a new CaptionVersion.
        updated = toCaptionDto(
          await this.captionRepo.applyEdit(input.captionId, input.editedText.trim())
        );
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
      caption: updated,
    };
  }
}
