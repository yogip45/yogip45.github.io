export const experiences = [
  {
    role: "Web Developer",
    period: "Jan 2025 - Present",
    isCurrent: true,
    company: "PT Indo Techno Medic",
    description:
      "Developing, refactoring, and maintaining web-based SIMRS and E-Pasien modules. Responsible for multi-user access logic, database query optimization, REST API integrations, on-site hospital deployment, and conducting train-the-trainer sessions for medical and administrative staff.",
  },
  {
    role: "Cyber Security Engineer (Intern)",
    period: "Feb - Jun 2024",
    isCurrent: false,
    company: "Gama Multi Group",
    description:
      "Executed security audits and penetration testing on government web applications to identify, document, and mitigate critical vulnerabilities.",
  },
  {
    role: "Fullstack Web Developer (Intern)",
    period: "Aug - Dec 2023",
    isCurrent: false,
    company: "Diskominfo Kebumen",
    description:
      "Built a full-stack Waste Bank Management system using CodeIgniter 3, digitalizing waste records and automating village-level reporting workflows.",
  },
];

export const services = [
  {
    icon: "fa-solid fa-code",
    title: "Web Development",
    description:
      "Developing and maintaining modular Hospital Management Systems (SIMRS) and patient portals with clean UI aesthetics and security in mind.",
    delay: 0,
  },
  {
    icon: "fa-solid fa-diagram-project",
    title: "Logic & API Integration",
    description:
      "Translating complex hospital business processes into structured multi-user workflows and seamless REST API integrations.",
    delay: 80,
  },
  {
    icon: "fa-solid fa-database",
    title: "Database Optimization",
    description:
      "Profiling and tuning relational queries across PostgreSQL, MySQL, and MS SQL Server to keep high-volume medical records responsive.",
    delay: 160,
  },
  {
    icon: "fa-solid fa-server",
    title: "Deployment & Rollout",
    description:
      "Managing Linux server environments and on-site system implementations to ensure smooth transitions from legacy workflows.",
    delay: 80,
  },
  {
    icon: "fa-solid fa-chalkboard-user",
    title: "Training & Support",
    description:
      "Leading hands-on workshops and train-the-trainer sessions for hospital staff during critical go-live phases.",
    delay: 160,
  },
];

export const showcaseItems = [
  {
    image: "/assets/img/gallery/simrs.png",
    alt: "Hospital Management System / SIMRS",
    type: "Project" as const,
    title: "Hospital Management System / SIMRS",
    description:
      "Developing & optimizing multi-user clinical and administrative modules at Technomedic SIMRS.",
    delay: 0,
  },
  {
    image: "/assets/img/gallery/cikrak.png",
    alt: "Waste Bank Management",
    type: "Project" as const,
    title: "Waste Bank Management",
    description:
      "Fullstack CodeIgniter 3 application developed for Diskominfo Kebumen.",
    delay: 80,
  },
  {
    image: "/assets/img/gallery/bronze_cert.png",
    alt: "Cisco Bronze Certificate",
    type: "Achievement" as const,
    title: "Cisco NetAcad Riders",
    description: "Bronze Certificate Winner — 2023",
    delay: 160,
  },
  {
    image: "/assets/img/gallery/silver_cert.png",
    alt: "Cisco Silver Certificate",
    type: "Achievement" as const,
    title: "Cisco NetAcad Riders",
    description: "Silver Certificate Winner — 2024",
    delay: 0,
  },
  {
    image: "/assets/img/gallery/mtcna.png",
    alt: "MikroTik MTCNA",
    type: "Credential" as const,
    title: "MTCNA Certified",
    description: "MikroTik Certified Network Associate",
    delay: 80,
  },
  {
    image: "/assets/img/gallery/jwd.png",
    alt: "Junior Web Developer BNSP",
    type: "Credential" as const,
    title: "Junior Web Developer",
    description: "BNSP Certified via Digital Talent Scholarship",
    delay: 160,
  },
];

export const techStack = [
  { name: "PHP", icon: "devicon-php-plain colored" },
  { name: "CodeIgniter", icon: "devicon-codeigniter-plain colored" },
  { name: "PostgreSQL", icon: "devicon-postgresql-plain colored" },
  { name: "MySQL", icon: "devicon-mysql-plain colored" },
  { name: "SQL Server", icon: "devicon-microsoftsqlserver-plain colored" },
  { name: "Bootstrap", icon: "devicon-bootstrap-plain colored" },
  { name: "jQuery", icon: "devicon-jquery-plain colored" },
  { name: "Ubuntu", icon: "devicon-ubuntu-plain colored" },
  { name: "CentOS", icon: "devicon-centos-plain colored" },
  { name: "Nginx", icon: "devicon-nginx-plain colored" },
  { name: "Docker", icon: "devicon-docker-plain colored" },
  { name: "Bash", icon: "devicon-bash-plain text-brown-dark" },
];

export const hobbies = [
  {
    icon: "fa-solid fa-headphones-simple",
    title: "Personal Audio & Music",
    description:
      "Listening to alternative rock, metal, and J-Pop through IEMs while tracking scrobbles on Last.fm.",
    delay: 0,
  },
  {
    icon: "fa-solid fa-server",
    title: "Home Lab & Self-Hosting",
    description:
      "Tinkering with mini PCs, Docker containers, private mesh networks, and local DNS setups.",
    delay: 80,
  },
  {
    icon: "fa-solid fa-book-open",
    title: "Books & Manga",
    description:
      "Diving into mystery fiction, classic literature, and manga series during quiet downtime.",
    delay: 160,
  },
  {
    icon: "fa-solid fa-film",
    title: "Anime & Tech Essays",
    description:
      "Unwinding with well-crafted animation, soundtracks, and deep-dive in tech infrastructure videos.",
    delay: 240,
  },
];
