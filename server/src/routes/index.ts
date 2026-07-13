import { Router } from "express";
import {
  AuthController,
  ExamplesController,
  FeedbackController,
  GenerateController,
  PrinciplesController,
  PromptTemplateController,
  RulesController,
} from "../controllers";
import { asyncHandler, requireAdmin } from "../middleware";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "caption-studio" });
});

router.post("/auth/login", asyncHandler(AuthController.login));

router.post("/generate", asyncHandler(GenerateController.generate));
router.post("/generate/preview", asyncHandler(GenerateController.preview));

router.post("/feedback", asyncHandler(FeedbackController.submit));

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

router.get("/prompt-template", asyncHandler(PromptTemplateController.get));
router.put("/prompt-template", asyncHandler(PromptTemplateController.update));
router.get("/prompt-template/versions", asyncHandler(PromptTemplateController.versions));
router.post("/prompt-template/revert", asyncHandler(PromptTemplateController.revert));

export default router;
