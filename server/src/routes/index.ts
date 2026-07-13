import { Router } from "express";
import {
  AuthController,
  ExamplesController,
  FeedbackController,
  GenerateController,
  PrinciplesController,
  PromptTemplateController,
  RulesController,
  SpeakersController,
} from "../controllers";
import { asyncHandler, requireAdmin } from "../middleware";

const router = Router();

// Health
router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "caption-studio" });
});

// Auth
router.post("/auth/login", asyncHandler(AuthController.login));

// Generation (public for content team)
router.post("/generate", asyncHandler(GenerateController.generate));
router.post("/generate/preview", asyncHandler(GenerateController.preview));

// Feedback loop
router.post("/feedback", asyncHandler(FeedbackController.submit));

// Speakers — list is public for the generate form
router.get("/speakers", asyncHandler(SpeakersController.list));

// Admin-protected management APIs
router.use(requireAdmin);

router.get("/examples", asyncHandler(ExamplesController.listGood));
router.post("/examples", asyncHandler(ExamplesController.createGood));
router.put("/examples/:id", asyncHandler(ExamplesController.updateGood));
router.delete("/examples/:id", asyncHandler(ExamplesController.deleteGood));

router.get("/bad-examples", asyncHandler(ExamplesController.listBad));
router.post("/bad-examples", asyncHandler(ExamplesController.createBad));
router.put("/bad-examples/:id", asyncHandler(ExamplesController.updateBad));
router.delete("/bad-examples/:id", asyncHandler(ExamplesController.deleteBad));

router.get("/rules", asyncHandler(RulesController.list));
router.put("/rules", asyncHandler(RulesController.replace));
router.post("/rules", asyncHandler(RulesController.create));
router.put("/rules/:id", asyncHandler(RulesController.update));
router.delete("/rules/:id", asyncHandler(RulesController.delete));

router.get("/principles", asyncHandler(PrinciplesController.list));
router.post("/principles", asyncHandler(PrinciplesController.create));
router.put("/principles/:id", asyncHandler(PrinciplesController.update));
router.delete("/principles/:id", asyncHandler(PrinciplesController.delete));

router.post("/speakers", asyncHandler(SpeakersController.create));
router.put("/speakers/:id", asyncHandler(SpeakersController.update));
router.delete("/speakers/:id", asyncHandler(SpeakersController.delete));

router.get("/prompt-template", asyncHandler(PromptTemplateController.get));
router.put("/prompt-template", asyncHandler(PromptTemplateController.update));
router.get("/prompt-template/versions", asyncHandler(PromptTemplateController.versions));
router.post("/prompt-template/revert", asyncHandler(PromptTemplateController.revert));

export default router;
