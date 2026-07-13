import type { Request, Response } from "express";
import type { CaptionStyle } from "@caption-studio/shared";
import { ClaudeService } from "../services/ClaudeService";
import { FeedbackService } from "../services/FeedbackService";
import {
  BadExampleRepository,
  GoodExampleRepository,
  PromptTemplateRepository,
  RuleRepository,
  SpeakerRepository,
  WritingPrincipleRepository,
} from "../repositories";
import {
  badExampleSchema,
  feedbackSchema,
  generateSchema,
  iterateSchema,
  goodExampleSchema,
  principleSchema,
  promptRevertSchema,
  promptTemplateUpdateSchema,
  rulesReplaceSchema,
  speakerSchema,
} from "../utils/validators";
import { AppError, paramId } from "../utils/helpers";

const claudeService = new ClaudeService();
const feedbackService = new FeedbackService();
const goodExampleRepo = new GoodExampleRepository();
const badExampleRepo = new BadExampleRepository();
const ruleRepo = new RuleRepository();
const principleRepo = new WritingPrincipleRepository();
const speakerRepo = new SpeakerRepository();
const templateRepo = new PromptTemplateRepository();

function parseBody<T>(schema: { parse: (data: unknown) => T }, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (err) {
    throw new AppError(400, "Validation failed", err);
  }
}

export class GenerateController {
  static async generate(req: Request, res: Response) {
    const body = parseBody(generateSchema, req.body);
    const result = await claudeService.generateCaptions({
      transcript: body.transcript,
      speaker: body.speaker,
      style: body.style as CaptionStyle,
      count: body.count,
      previewOnly: body.previewOnly,
    });
    res.json(result);
  }

  static async preview(req: Request, res: Response) {
    const body = parseBody(generateSchema, req.body);
    const built = await claudeService.previewPrompt({
      transcript: body.transcript,
      speaker: body.speaker,
      style: body.style as CaptionStyle,
      count: body.count,
    });
    res.json({ promptPreview: built.prompt, parts: built.parts });
  }

  static async iterate(req: Request, res: Response) {
    const body = parseBody(iterateSchema, req.body);
    const result = await claudeService.iterateCaptions({
      transcript: body.transcript,
      speaker: body.speaker,
      style: body.style as CaptionStyle,
      currentCaptions: body.currentCaptions,
      iterationNotes: body.iterationNotes,
      count: body.count,
    });
    res.json(result);
  }
}

export class FeedbackController {
  static async submit(req: Request, res: Response) {
    const body = parseBody(feedbackSchema, req.body);
    const result = await feedbackService.submit(body);
    res.json(result);
  }
}

export class ExamplesController {
  static async listGood(req: Request, res: Response) {
    const examples = await goodExampleRepo.findAll({
      style: req.query.style as string | undefined,
      category: req.query.category as string | undefined,
    });
    res.json(examples);
  }

  static async createGood(req: Request, res: Response) {
    const body = parseBody(goodExampleSchema, req.body);
    const example = await goodExampleRepo.create({
      ...body,
      style: body.style ?? undefined,
    });
    res.status(201).json(example);
  }

  static async updateGood(req: Request, res: Response) {
    const body = parseBody(goodExampleSchema.partial(), req.body);
    const example = await goodExampleRepo.update(paramId(req.params.id), body);
    res.json(example);
  }

  static async deleteGood(req: Request, res: Response) {
    await goodExampleRepo.delete(paramId(req.params.id));
    res.status(204).send();
  }

  static async listBad(_req: Request, res: Response) {
    const examples = await badExampleRepo.findAll();
    res.json(examples);
  }

  static async createBad(req: Request, res: Response) {
    const body = parseBody(badExampleSchema, req.body);
    const example = await badExampleRepo.create(body);
    res.status(201).json(example);
  }

  static async updateBad(req: Request, res: Response) {
    const body = parseBody(badExampleSchema.partial(), req.body);
    const example = await badExampleRepo.update(paramId(req.params.id), body);
    res.json(example);
  }

  static async deleteBad(req: Request, res: Response) {
    await badExampleRepo.delete(paramId(req.params.id));
    res.status(204).send();
  }
}

export class RulesController {
  static async list(_req: Request, res: Response) {
    const rules = await ruleRepo.findAll();
    res.json(rules);
  }

  static async replace(req: Request, res: Response) {
    const body = parseBody(rulesReplaceSchema, req.body);
    const rules = await ruleRepo.replaceAll(body.rules);
    res.json(rules);
  }

  static async create(req: Request, res: Response) {
    const content = zString(req.body.content);
    const rule = await ruleRepo.create({
      content,
      sortOrder: typeof req.body.sortOrder === "number" ? req.body.sortOrder : 0,
      isActive: req.body.isActive ?? true,
    });
    res.status(201).json(rule);
  }

  static async update(req: Request, res: Response) {
    const rule = await ruleRepo.update(paramId(req.params.id), req.body);
    res.json(rule);
  }

  static async delete(req: Request, res: Response) {
    await ruleRepo.delete(paramId(req.params.id));
    res.status(204).send();
  }
}

function zString(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(400, "content is required");
  }
  return value.trim();
}

export class PrinciplesController {
  static async list(_req: Request, res: Response) {
    const principles = await principleRepo.findAll();
    res.json(principles);
  }

  static async create(req: Request, res: Response) {
    const body = parseBody(principleSchema, req.body);
    const principle = await principleRepo.create(body);
    res.status(201).json(principle);
  }

  static async update(req: Request, res: Response) {
    const body = parseBody(principleSchema.partial(), req.body);
    const principle = await principleRepo.update(paramId(req.params.id), body);
    res.json(principle);
  }

  static async delete(req: Request, res: Response) {
    await principleRepo.delete(paramId(req.params.id));
    res.status(204).send();
  }
}

export class SpeakersController {
  static async list(_req: Request, res: Response) {
    const speakers = await speakerRepo.findAll();
    res.json(speakers);
  }

  static async create(req: Request, res: Response) {
    const body = parseBody(speakerSchema, req.body);
    const speaker = await speakerRepo.create({
      ...body,
      notes: body.notes ?? undefined,
    });
    res.status(201).json(speaker);
  }

  static async update(req: Request, res: Response) {
    const body = parseBody(speakerSchema.partial(), req.body);
    const speaker = await speakerRepo.update(paramId(req.params.id), body);
    res.json(speaker);
  }

  static async delete(req: Request, res: Response) {
    await speakerRepo.delete(paramId(req.params.id));
    res.status(204).send();
  }
}

export class PromptTemplateController {
  static async get(_req: Request, res: Response) {
    const template = await templateRepo.findActive();
    if (!template) throw new AppError(404, "No prompt template found");
    const versions = await templateRepo.getVersions(template.id);
    res.json({ ...template, versions });
  }

  static async update(req: Request, res: Response) {
    const body = parseBody(promptTemplateUpdateSchema, req.body);
    const template = await templateRepo.findActive();
    if (!template) throw new AppError(404, "No prompt template found");
    const updated = await templateRepo.update(template.id, body.content);
    res.json(updated);
  }

  static async revert(req: Request, res: Response) {
    const body = parseBody(promptRevertSchema, req.body);
    const template = await templateRepo.findActive();
    if (!template) throw new AppError(404, "No prompt template found");
    const updated = await templateRepo.revertToVersion(template.id, body.version);
    res.json(updated);
  }

  static async versions(_req: Request, res: Response) {
    const template = await templateRepo.findActive();
    if (!template) throw new AppError(404, "No prompt template found");
    const versions = await templateRepo.getVersions(template.id);
    res.json(versions);
  }
}

export class AuthController {
  static async login(req: Request, res: Response) {
    const password = req.body?.password;
    const { config } = await import("../config");
    if (password !== config.adminPassword) {
      throw new AppError(401, "Invalid password");
    }
    res.json({ ok: true, token: password });
  }
}
