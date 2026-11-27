export interface ShowcaseItem {
  id: string;
  category: "project" | "credential";
  badge: string;
  title: string;
  subtitle: string;
  year: string;
  role: string;
  image: string;
  summary: string;
  highlights: string[];
  stack: string[];
  repoUrl?: string;
  liveUrl?: string;
}

export const showcaseItems: ShowcaseItem[] = [
  {
    id: "simrs-technomedic",
    category: "project",
    badge: "HEALTHCARE CORE",
    title: "SIMRS & ANTENG (e-Pasien)",
    subtitle: "Hospital Management Information System & Patient App",
    year: "2025 — Present",
    role: "Web Developer & System Implementer",
    image: "/assets/img/gallery/simrs.png",
    summary:
      "End-to-end web-based Hospital Management Information System and online patient registration portal deployed across partner hospitals in Central Java and North Sumatra.",
    highlights: [
      "Engineered dynamic clinical reporting modules, medical record printouts, and optimized heavy PostgreSQL queries for high-concurrency hospital operations.",
      "Built and maintained external healthcare bridging workflows including BPJS VClaim, HFIS, Antrean Online, SatuSehat, and Sysmex LIS/RIS.",
      "Led on-site system rollouts, user training (sosialisasi), and CentOS 10 multi-pool PHP-FPM production tuning.",
    ],
    stack: [
      "PHP 7.4",
      "CodeIgniter 3",
      "PostgreSQL",
      "jQuery",
      "Bootstrap",
      "CentOS 10",
      "BPJS / SatuSehat API",
    ],
  },
  {
    id: "waste-bank",
    category: "project",
    badge: "CIVIC WEB APP",
    title: "Waste Bank Management System",
    subtitle: "Diskominfo Kebumen Digital Waste Accounting Platform",
    year: "2023",
    role: "Fullstack Web Developer Intern",
    image: "/assets/img/gallery/cikrak.png",
    summary:
      "Web platform built for Diskominfo Kebumen to digitize community waste bank deposits, member balance tracking, and administrative reporting.",
    highlights: [
      "Designed relational database schemas for waste categorization, fluctuating price tiers, and member savings ledgers.",
      "Developed role-based dashboards for operators and administrators with automated transaction summaries.",
    ],
    stack: ["PHP", "CodeIgniter 3", "MySQL", "Bootstrap 5", "JavaScript"],
  },
  {
    id: "cisco-netacad",
    category: "credential",
    badge: "NETWORKING",
    title: "Cisco NetAcad Riders",
    subtitle: "Bronze & Silver Certificate Achievements",
    year: "2023 — 2024",
    role: "National Networking Competition Finalist",
    image: "/assets/img/gallery/bronze_cert.png",
    summary:
      "Awarded Bronze (2023) and Silver (2024) Certificates in the Cisco NetAcad Riders competition, validating practical routing, switching, and network troubleshooting skills.",
    highlights: [
      "Configured VLANs, inter-VLAN routing, OSPF, NAT, and ACL security policies under timed lab scenarios.",
      "Diagnosed and resolved multi-layer network topology faults using Cisco Packet Tracer and CLI diagnostics.",
    ],
    stack: [
      "Cisco IOS",
      "Routing & Switching",
      "OSPF",
      "VLAN / ACL",
      "Network Troubleshooting",
    ],
  },
  {
    id: "mtcna-cert",
    category: "credential",
    badge: "INFRASTRUCTURE",
    title: "MikroTik Certified Network Associate",
    subtitle: "MTCNA Official Certification",
    year: "2024",
    role: "Certified Network Associate",
    image: "/assets/img/gallery/mtcna.png",
    summary:
      "Certified proficiency in RouterOS configuration, firewall filtering, bandwidth management (Queues), VPN tunneling, and wireless bridge setups.",
    highlights: [
      "Implemented stateful firewall rules, NAT masquerading, and Simple/Tree Queues for QoS bandwidth allocation.",
      "Configured secure site-to-site VPN tunnels and DHCP/DNS services on MikroTik RouterOS.",
    ],
    stack: [
      "MikroTik RouterOS",
      "Firewall & NAT",
      "QoS Queues",
      "VPN Tunneling",
      "TCP/IP",
    ],
  },
];
