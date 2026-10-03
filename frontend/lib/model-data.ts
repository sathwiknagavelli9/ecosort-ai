import type { WasteClass } from "@/types/prediction";

export const MODEL_METRICS = {
  modelName: "MobileNetV2 transfer learning",
  inputShape: [224, 224, 3],
  preprocessing: "x / 127.5 - 1.0 (embedded in the model)",
  classes: [
    "cardboard",
    "glass",
    "metal",
    "paper",
    "plastic",
    "trash",
  ] satisfies WasteClass[],
  dataset: {
    name: "TrashNet resized",
    originalImages: 2527,
    quarantinedConflicts: 6,
    usableImages: 2521,
    trainImages: 1800,
    validationImages: 360,
    testImages: 361,
  },
  evaluation: {
    testAccuracy: 0.850415512465374,
    macroPrecision: 0.8256227190345299,
    macroRecall: 0.8280514797222903,
    macroF1: 0.8259942272207406,
    weightedF1: 0.8493687824131492,
  },
  perClass: [
    {
      class: "cardboard",
      displayName: "Cardboard",
      precision: 0.9473684210526315,
      recall: 0.9310344827586207,
      f1: 0.9391304347826087,
      support: 58,
    },
    {
      class: "glass",
      displayName: "Glass",
      precision: 0.803030303030303,
      recall: 0.7464788732394366,
      f1: 0.7737226277372263,
      support: 71,
    },
    {
      class: "metal",
      displayName: "Metal",
      precision: 0.8208955223880597,
      recall: 0.9322033898305084,
      f1: 0.873015873015873,
      support: 59,
    },
    {
      class: "paper",
      displayName: "Paper",
      precision: 0.9294117647058824,
      recall: 0.9404761904761905,
      f1: 0.9349112426035503,
      support: 84,
    },
    {
      class: "plastic",
      displayName: "Plastic",
      precision: 0.803030303030303,
      recall: 0.7681159420289855,
      f1: 0.7851851851851852,
      support: 69,
    },
    {
      class: "trash",
      displayName: "Trash",
      precision: 0.65,
      recall: 0.65,
      f1: 0.65,
      support: 20,
    },
  ],
  training: {
    architecture: "MobileNetV2",
    pretrainedOn: "ImageNet",
    initialEpochs: 25,
    fineTuneEpochs: 12,
    dropoutRate: 0.35,
    selectedStage: "Fine-tuned model",
  },
} as const;

export type CategoryInfo = {
  class: WasteClass;
  name: string;
  shortDescription: string;
  guidance: string;
  accent: string;
};

export const CATEGORY_INFO: CategoryInfo[] = [
  {
    class: "cardboard",
    name: "Cardboard",
    shortDescription: "Boxes, cartons, and corrugated packaging.",
    guidance: "Keep it clean and dry, then flatten it where accepted.",
    accent: "ochre",
  },
  {
    class: "glass",
    name: "Glass",
    shortDescription: "Bottles, jars, and other glass containers.",
    guidance: "Empty and lightly rinse containers; handle broken glass separately.",
    accent: "aqua",
  },
  {
    class: "metal",
    name: "Metal",
    shortDescription: "Cans, tins, and metal containers.",
    guidance: "Empty and lightly clean items before recycling where accepted.",
    accent: "slate",
  },
  {
    class: "paper",
    name: "Paper",
    shortDescription: "Sheets, newspapers, and paper packaging.",
    guidance: "Recycle clean, dry paper; heavily soiled or coated paper may not qualify.",
    accent: "sky",
  },
  {
    class: "plastic",
    name: "Plastic",
    shortDescription: "Plastic containers and packaging.",
    guidance: "Check the resin marking and your local program—acceptance varies widely.",
    accent: "violet",
  },
  {
    class: "trash",
    name: "Trash",
    shortDescription: "Items outside the five named material groups.",
    guidance: "Follow local municipal guidance; this label does not mean hazardous waste.",
    accent: "rose",
  },
];

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}
