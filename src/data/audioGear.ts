export interface AudioGearItem {
  name: string;
  tag: string;
  isPrimary: boolean;
  isRetired: boolean;
  image: string;
  fallbackIcon: string;
  fallbackLabel: string;
  description: string;
  specs: string[];
}

export const signalChain = [
  { label: "MAIN IEM", value: "Moondrop Lan 2" },
  { label: "MAIN TWS", value: "Galaxy Buds3 FE" },
  { label: "MAIN SPEAKER", value: "Edifier MP85" },
];

export const audioGears: AudioGearItem[] = [
  {
    name: "Moondrop Lan 2",
    tag: "MAIN IEM",
    isPrimary: true,
    isRetired: false,
    image: "/assets/img/gear/lan2.jpg",
    fallbackIcon: "fa-solid fa-ear-listen",
    fallbackLabel: "IEM WIRED",
    description:
      "Primary wired driver for focused listening, clean instrument separation, and desk sessions.",
    specs: ["Wired IEM", "10mm Dynamic Driver", "Daily Main"],
  },
  {
    name: "Galaxy Buds3 FE",
    tag: "MAIN TWS",
    isPrimary: true,
    isRetired: false,
    image: "/assets/img/gear/buds3fe.jpg",
    fallbackIcon: "fa-solid fa-headphones",
    fallbackLabel: "SAMSUNG TWS",
    description:
      "Go-to wireless buds for seamless daily commute, calls, and outdoor mobility.",
    specs: ["TWS / ANC", "11mm 1-way Dynamic", "Commute"],
  },
  {
    name: "Edifier MP85",
    tag: "MAIN SPEAKER",
    isPrimary: true,
    isRetired: false,
    image: "/assets/img/gear/mp85.jpg",
    fallbackIcon: "fa-solid fa-volume-high",
    fallbackLabel: "BT SPEAKER",
    description:
      "Ultra-compact 70g portable speaker with vocal-tuned clarity and Edifier Connect EQ profiles for casual desk playback.",
    specs: ["40mm Full-Range", "2.2W RMS", "BT 5.3 · 8h Battery"],
  },
  {
    name: "Moondrop Moca",
    tag: "SECONDARY TWS",
    isPrimary: false,
    isRetired: false,
    image: "/assets/img/gear/moondrop-moca-grey.jpg",
    fallbackIcon: "fa-solid fa-wave-square",
    fallbackLabel: "MOONDROP TWS",
    description:
      "Alternative wireless rotation with Moondrop's signature vocal tuning and LC3 support.",
    specs: ["10mm Ti-Ceramic", "Single Dynamic", "Hybrid ANC"],
  },
  {
    name: "Moondrop Chu II",
    tag: "RETIRED",
    isPrimary: false,
    isRetired: true,
    image: "/assets/img/gear/chu2.jpg",
    fallbackIcon: "fa-solid fa-box-archive",
    fallbackLabel: "ARCHIVED",
    description:
      "Former daily driver. Officially retired from rotation after having a problem with the left driver and upgrading to Lan 2.",
    specs: ["10mm Dynamic", "Retired"],
  },
  {
    name: "Moondrop Nekocake",
    tag: "RETIRED",
    isPrimary: false,
    isRetired: true,
    image: "/assets/img/gear/nekocake.jpg",
    fallbackIcon: "fa-solid fa-box-archive",
    fallbackLabel: "ARCHIVED",
    description:
      "Former daily driver TWS. Officially retired after upgrading to Moondrop Moca.",
    specs: ["13mm Dynamic Driver", "Retired"],
  },
];
