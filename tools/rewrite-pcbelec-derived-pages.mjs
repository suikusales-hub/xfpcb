import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = "C:/Users/Administrator/Documents/XFPCB";
const siteDir = path.join(root, "site");
const researchDir = path.join(root, "tools", "research", "pcbelec-pages");
const competitorBase = "https://www.pcbelec.com";
const xfpcbBase = "https://xfpcb.com";
const web3formsKey = "40f0bc17-2a5a-45e0-85cf-99aa9d8b06df";

const stripTrailingSlash = (value) => value.replace(/\/+$/, "") || "/";
const ensureTrailingSlash = (value) => value.endsWith("/") ? value : `${value}/`;
const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const customerCopy = (value = "") => String(value)
  .replace(/High-risk/g, "Complex")
  .replace(/high-risk/g, "complex")
  .replace(/handoff risk/g, "handoff complexity")
  .replace(/sourcing risk/g, "sourcing uncertainty")
  .replace(/BOM risk/g, "BOM uncertainty")
  .replace(/void risks/g, "void concerns")
  .replace(/component risk/g, "component complexity")
  .replace(/product risks/g, "product requirements")
  .replace(/supplier mismatch/g, "supplier selection issues")
  .replace(/Buyer action/g, "Customer input")
  .replace(/Buyer value/g, "Customer value")
  .replace(/Buyer benefit/g, "Customer benefit")
  .replace(/Buyer question/g, "Project detail")
  .replace(/Buyer role/g, "Customer role")
  .replace(/\bbuyers\b/g, "customers")
  .replace(/\bBuyers\b/g, "Customers")
  .replace(/\bbuyer\b/g, "customer")
  .replace(/\bBuyer\b/g, "Customer")
  .replace(/Main risk/g, "Production control point")
  .replace(/\bRisk\b/g, "Production control point")
  .replace(/\brisk\b/g, "production concern")
  .replace(/Design concern/g, "Design detail")
  .replace(/Assembly concern/g, "Assembly detail")
  .replace(/supplier's process window/g, "XFPCB production scope")
  .replace(/quotation assumptions/g, "quotation details")
  .replace(/manufacturing assumptions/g, "manufacturing details")
  .replace(/engineering assumptions/g, "engineering details")
  .replace(/purchasing assumptions/g, "purchasing details")
  .replace(/production assumptions/g, "production details")
  .replace(/wrong assumptions/g, "wrong specifications")
  .replace(/final manufacturing assumptions/g, "final manufacturing plan")
  .replace(/\bassumptions\b/gi, "details")
  .replace(/fewer unknowns/g, "clearer approval points")
  .replace(/\bunknowns\b/g, "open items")
  .replace(/flag questions related to/g, "confirm details for")
  .replace(/flag questions/g, "confirm details")
  .replace(/Engineering questions/g, "Engineering details")
  .replace(/engineering questions/g, "engineering details")
  .replace(/manufacturability questions/g, "manufacturability details")
  .replace(/file questions/g, "file details")
  .replace(/open questions/g, "open details")
  .replace(/questions before/g, "details before");

const decodeEntities = (value = "") => value
  .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, "'");

const htmlToText = (html = "") => decodeEntities(html
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
  .replace(/<[^>]+>/g, " "))
  .replace(/\s+/g, " ")
  .trim();

const slugify = (value) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 90);

async function walkIndexFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkIndexFiles(full));
    } else if (entry.name === "index.html") {
      files.push(full);
    }
  }
  return files;
}

function pagePathFromFile(file) {
  const rel = path.relative(siteDir, file).replaceAll(path.sep, "/");
  if (rel === "index.html") return "/";
  return `/${rel.replace(/\/index\.html$/, "")}/`;
}

async function findGeneratedTargets() {
  const files = await walkIndexFiles(siteDir);
  const targets = [];
  const fallbackTargets = [];
  for (const file of files) {
    const html = await readFile(file, "utf8");
    const pagePath = pagePathFromFile(file);
    if (html.includes("Buyer Intent and XFPCB Fit")) {
      targets.push({ file, path: pagePath, oldHtml: html });
    } else if (topicOverrides[pagePath]) {
      fallbackTargets.push({ file, path: pagePath, oldHtml: html });
    }
  }
  return (targets.length ? targets : fallbackTargets).sort((a, b) => a.path.localeCompare(b.path));
}

function extractFallback(oldHtml, tag) {
  const match = oldHtml.match(new RegExp(`<${tag}>[\\s\\S]*?<\\/ ${tag}>`.replace(" ", ""), "i"));
  if (!match) return `<${tag}></${tag}>`;
  return match[0];
}

function extractCompetitor(html, sourceUrl) {
  const title = htmlToText((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
  const metaDescription = htmlToText((html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) || [])[1] || "");
  const headings = [];
  for (const tag of ["h1", "h2", "h3"]) {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
    let match;
    while ((match = re.exec(html))) {
      const text = htmlToText(match[1]);
      if (text && !headings.some((item) => item.text === text)) {
        headings.push({ tag, text });
      }
    }
  }
  const paragraphs = [];
  const paragraphRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  while ((pMatch = paragraphRe.exec(html))) {
    const text = htmlToText(pMatch[1]);
    if (text.length > 80 && text.length < 520 && !/cookie|privacy policy/i.test(text)) {
      paragraphs.push(text);
    }
    if (paragraphs.length >= 12) break;
  }
  const images = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter((src) => !/logo|avatar|icon|data:image/i.test(src))
    .map((src) => src.startsWith("http") ? src : new URL(src, sourceUrl).toString())
    .slice(0, 18);
  return {
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    title,
    metaDescription,
    h1: headings.find((item) => item.tag === "h1")?.text || "",
    headings,
    paragraphs,
    images
  };
}

const competitorPathOverrides = new Map([
  ["/pcb-assembly/through-hole-pcb-assembly/", "/pcb-assembly/through-hole-pcb-assembly-2"],
  ["/pcb-assembly/mixed-technology-pcb-assembly-services/", "/mixed-technology-pcb-assembly-services"],
  ["/pcb-assembly/low-cost-pcb-assembly/", "/pcb-assembly/low-cost-pcb-assembly-2"],
  ["/pcb-assembly/quick-turn-pcb-assembly/", "/pcb-assembly/quick-turn-pcb-assembly-2"]
]);

function competitorPathFor(pagePath) {
  return competitorPathOverrides.get(pagePath) || stripTrailingSlash(pagePath);
}

async function fetchResearchForTargets(targets) {
  await mkdir(researchDir, { recursive: true });
  const results = new Map();
  async function fetchOne(target) {
    const competitorPath = competitorPathFor(target.path);
    const sourceUrl = competitorPath === "/" ? competitorBase : `${competitorBase}${competitorPath}`;
    const researchFile = path.join(researchDir, `${slugify(competitorPath === "/" ? "home" : competitorPath)}.json`);
    let research;
    try {
      const existing = JSON.parse(await readFile(researchFile, "utf8"));
      if (existing && existing.sourceUrl && (existing.title || existing.h1 || existing.headings?.length || existing.status === 404)) {
        results.set(target.path, existing);
        return;
      }
    } catch {
      // Fetch below when no usable research file exists yet.
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(sourceUrl, {
        signal: controller.signal,
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36"
        }
      });
      const html = await response.text();
      clearTimeout(timer);
      research = extractCompetitor(html, sourceUrl);
      research.status = response.status;
      await writeFile(researchFile, JSON.stringify(research, null, 2), "utf8");
    } catch (error) {
      research = {
        sourceUrl,
        status: 0,
        error: error.message,
        title: "",
        h1: "",
        metaDescription: "",
        headings: [],
        paragraphs: [],
        images: []
      };
      await writeFile(researchFile, JSON.stringify(research, null, 2), "utf8");
    }
    results.set(target.path, research);
  }
  const queue = [...targets];
  const workers = Array.from({ length: 5 }, async () => {
    while (queue.length) {
      const target = queue.shift();
      await fetchOne(target);
    }
  });
  await Promise.all(workers);
  return results;
}

const imageMap = {
  manufacturing: "/images/xfpcb-pcb-manufacturing-service.png",
  prototype: "/images/xfpcb-pcb-prototype-service.png",
  specialty: "/images/hdi-pcb-inspection-xfpcb.png",
  flex: "/images/xfpcb-flex-rigidflex-pcb.png",
  thermal: "/images/xfpcb-metal-core-led-pcb.png",
  assembly: "/images/pcba-manufacturing-hero.png",
  smt: "/images/smt-pcba-assembly-process.png",
  sourcing: "/images/xfpcb-component-sourcing-stencil.png",
  capability: "/images/xfpcb-technical-capabilities.png",
  testing: "/images/xfpcb-testing-inspection.png",
  industry: "/images/xfpcb-industries-served.png",
  company: "/images/xfpcb-china-pcb-manufacturer.png",
  materials: "/images/multilayer-pcb-stackup-inspection.png",
  quality: "/images/pcba-quality-inspection-testing.png"
};

const topicOverrides = {
  "/prototype-pcb/": {
    category: "prototype",
    label: "Prototype PCB",
    h1: "PCB Prototype Services for Fast Engineering Validation",
    title: "PCB Prototype Services | Fast Prototype PCB Manufacturer | XFPCB",
    description: "XFPCB provides prototype PCB fabrication with DFM review, practical lead-time planning, and a clear path from first samples to production.",
    keywords: ["PCB prototype", "prototype PCB manufacturer", "fast PCB prototype", "quick turn PCB prototype"],
    focus: "early engineering validation, design debugging, and controlled transition into repeat PCB production",
    mustInclude: ["Gerber and drill review", "sample build communication", "small batch to production bridge", "cost and schedule tradeoff"],
    metrics: [["Typical order stage", "Engineering samples, validation lots, pilot builds"], ["Main files", "Gerber, drill, stackup, impedance notes, finish and quantity"], ["XFPCB value", "DFM feedback before production risk becomes expensive"]],
    image: imageMap.prototype
  },
  "/pcb-manufacturing/": {
    category: "manufacturing",
    label: "PCB Manufacturing",
    h1: "PCB Manufacturing Services from Prototype to Mass Production",
    title: "PCB Manufacturing Services | China PCB Manufacturer | XFPCB",
    description: "XFPCB manufactures rigid, flex, HDI, metal core and multilayer PCBs for global buyers that need engineering support, quality control and scalable supply.",
    keywords: ["PCB manufacturing", "PCB manufacturer", "PCB fabrication", "China PCB manufacturer"],
    focus: "complete PCB fabrication coverage from simple FR-4 boards to advanced multilayer, HDI, flex and thermal PCB designs",
    mustInclude: ["CAM and DFM review", "material and stackup confirmation", "electrical testing", "prototype to mass production planning"],
    metrics: [["Product scope", "Rigid PCB, flexible PCB, rigid-flex PCB, HDI PCB, metal core PCB"], ["Layer capability", "Single-sided boards through high-layer-count multilayer projects"], ["Buyer outcome", "One accountable fabrication partner for recurring PCB sourcing"]],
    image: imageMap.manufacturing
  },
  "/pcb-manufacturing/custom-circuit-board-printing/": {
    category: "manufacturing",
    label: "Custom PCB",
    h1: "Custom PCB Manufacturing for Application-Specific Designs",
    title: "Custom PCB Manufacturing | Custom Circuit Board Printing | XFPCB",
    description: "XFPCB builds custom printed circuit boards with engineering review for layer count, materials, copper, surface finish, tolerances and assembly needs.",
    keywords: ["custom PCB", "custom circuit board printing", "custom PCB manufacturer", "custom printed circuit board"],
    focus: "turning non-standard PCB requirements into manufacturable boards with clear engineering assumptions",
    mustInclude: ["custom stackup review", "material and surface finish selection", "assembly-aware panelization", "repeat order documentation"],
    metrics: [["Best fit", "Products that cannot be solved by a catalog board"], ["Engineering inputs", "Gerber, drill, drawing, stackup, test and assembly notes"], ["Manufacturing view", "Confirm the cost drivers before board release"]],
    image: imageMap.manufacturing
  },
  "/pcb-manufacturing/quick-turn-pcb/": {
    category: "prototype",
    label: "Quick Turn PCB",
    h1: "Quick Turn PCB Manufacturing with Practical DFM Control",
    title: "Quick Turn PCB Manufacturing | Fast PCB Fabrication | XFPCB",
    description: "XFPCB supports quick turn PCB fabrication for urgent prototypes and engineering builds where speed must still be balanced with manufacturability.",
    keywords: ["quick turn PCB", "fast PCB fabrication", "quick PCB manufacturer", "rapid PCB manufacturing"],
    focus: "compressing schedule without ignoring stackup, drilling, solder mask, finish and final electrical test requirements",
    mustInclude: ["file readiness", "material availability", "schedule-sensitive CAM checks", "shipping planning"],
    metrics: [["Speed depends on", "Layer count, material, finish, drill density and quantity"], ["Best RFQ habit", "Send complete files and flag the fixed deadline"], ["Risk control", "Fast review before production starts"]],
    image: imageMap.prototype
  },
  "/pcb-manufacturing/low-cost-pcbs-fabrication/": {
    category: "manufacturing",
    label: "Low Cost PCB",
    h1: "Low Cost PCB Fabrication without Hiding the Tradeoffs",
    title: "Low Cost PCB Fabrication | Value PCB Manufacturing | XFPCB",
    description: "XFPCB helps buyers reduce PCB cost through specification review, panel efficiency, material selection and practical manufacturing planning.",
    keywords: ["low cost PCB", "low cost PCB fabrication", "affordable PCB manufacturer", "cost effective PCB"],
    focus: "reducing real PCB cost by improving specifications, panelization, material choices and repeat purchasing visibility",
    mustInclude: ["cost driver review", "standard material selection", "panel utilization", "avoid over-specified tolerances"],
    metrics: [["Cost levers", "Panel size, finish, copper, drill count, tolerance and batch size"], ["Not recommended", "Removing inspection or accepting unclear files"], ["XFPCB value", "Lower cost with traceable requirements"]],
    image: imageMap.manufacturing
  },
  "/pcb-manufacturing/bga-pcb/": {
    category: "specialty",
    label: "BGA PCB",
    h1: "BGA PCB Manufacturing for Fine-Pitch Components",
    title: "BGA PCB Manufacturing | Fine Pitch PCB Supplier | XFPCB",
    description: "XFPCB manufactures BGA PCBs with routing, via, solder mask, surface finish and inspection planning for dense electronic assemblies.",
    keywords: ["BGA PCB", "BGA PCB manufacturer", "fine pitch PCB", "BGA circuit board"],
    focus: "supporting fine-pitch BGA fanout, solderability and downstream PCBA inspection requirements",
    mustInclude: ["via-in-pad discussion", "solder mask registration", "ENIG surface finish review", "X-ray inspection coordination"],
    metrics: [["Design concern", "BGA escape routing and pad reliability"], ["Assembly concern", "Hidden solder joints require process control"], ["Related service", "Pair with PCBA and X-ray inspection when needed"]],
    image: imageMap.specialty
  },
  "/pcb-manufacturing/hdi-pcb/": {
    category: "specialty",
    label: "HDI PCB",
    h1: "HDI PCB Manufacturing for Dense, Reliable Electronics",
    title: "HDI PCB Manufacturing | Microvia PCB Manufacturer | XFPCB",
    description: "XFPCB supports HDI PCB manufacturing for dense routing, microvia structures, compact products, BGA designs and controlled lamination planning.",
    keywords: ["HDI PCB", "HDI PCB manufacturing", "microvia PCB", "HDI PCB manufacturer"],
    focus: "building compact boards that need microvias, blind and buried via planning, high-density routing and careful stackup communication",
    mustInclude: ["microvia strategy", "sequential lamination", "BGA fanout", "DFM review for dense routing"],
    metrics: [["Common structures", "1+N+1, 2+N+2, via-in-pad or buried via designs depending on files"], ["Main risk", "Over-aggressive density without stackup review"], ["XFPCB link", "Use HDI with controlled impedance, BGA and PCBA support"]],
    image: imageMap.specialty
  },
  "/pcb-manufacturing/gold-fingers-pcb/": {
    category: "specialty",
    label: "Gold Finger PCB",
    h1: "Gold Finger PCB Manufacturing for Edge Connector Reliability",
    title: "Gold Finger PCB Manufacturing | Hard Gold Edge Connector PCB | XFPCB",
    description: "XFPCB manufactures gold finger PCBs with hard gold plating, beveling, connector edge control and inspection for repeated insertion applications.",
    keywords: ["gold finger PCB", "hard gold PCB", "edge connector PCB", "gold fingers PCB manufacturer"],
    focus: "protecting card-edge connectors where plating thickness, bevel angle and solder mask clearance influence service life",
    mustInclude: ["hard gold plating", "beveled connector edge", "plating thickness confirmation", "connector fit review"],
    metrics: [["Typical use", "Modules, adapter cards, industrial controllers and test fixtures"], ["Critical detail", "Gold finger area and bevel instructions must be clear"], ["Quality focus", "Visual inspection plus electrical test for finished boards"]],
    image: imageMap.specialty
  },
  "/pcb-manufacturing/high-frequency-pcb/": {
    category: "specialty",
    label: "High Frequency PCB",
    h1: "High Frequency PCB Manufacturing for RF and High-Speed Designs",
    title: "High Frequency PCB Manufacturing | RF PCB Supplier | XFPCB",
    description: "XFPCB builds high frequency PCBs with material, stackup, impedance and fabrication review for RF, microwave and high-speed communication designs.",
    keywords: ["high frequency PCB", "RF PCB manufacturer", "high speed PCB", "Rogers PCB"],
    focus: "supporting RF and high-speed signals where laminate selection, loss, copper profile and controlled impedance matter",
    mustInclude: ["Rogers or hybrid materials", "impedance planning", "insertion loss awareness", "stackup communication"],
    metrics: [["Material discussion", "Rogers, PTFE, high-speed FR-4 or hybrid stackups as project requires"], ["Signal concern", "Dielectric constant, loss tangent and copper roughness"], ["Buyer action", "Share target impedance and frequency range early"]],
    image: imageMap.specialty
  },
  "/pcb-manufacturing/impedance-control-pcb/": {
    category: "specialty",
    label: "Impedance Control PCB",
    h1: "Impedance Control PCB Fabrication for Predictable Signals",
    title: "Impedance Control PCB Fabrication | Controlled Impedance PCB | XFPCB",
    description: "XFPCB supports controlled impedance PCB fabrication with stackup review, trace geometry planning, coupons and engineering communication.",
    keywords: ["impedance control PCB", "controlled impedance PCB", "PCB impedance manufacturer", "high speed PCB fabrication"],
    focus: "aligning stackup, trace width, dielectric thickness and copper so high-speed interfaces behave as intended",
    mustInclude: ["target impedance", "stackup calculation", "test coupon planning", "material tolerance review"],
    metrics: [["Typical targets", "50 ohm single-ended, 90 or 100 ohm differential when specified"], ["Needed data", "Layer, trace width, spacing and reference plane"], ["Risk", "Changing materials after layout can change impedance"]],
    image: imageMap.specialty
  },
  "/pcb-manufacturing/rigid-pcb/": {
    category: "manufacturing",
    label: "Rigid PCB",
    h1: "Rigid PCB Manufacturing for Stable Electronic Products",
    title: "Rigid PCB Manufacturing | FR4 Circuit Board Supplier | XFPCB",
    description: "XFPCB manufactures rigid PCBs for industrial, consumer, power and communication products with engineering review and repeatable production control.",
    keywords: ["rigid PCB", "rigid PCB manufacturer", "FR4 PCB", "rigid circuit board"],
    focus: "providing stable FR-4 and multilayer rigid boards for products that need predictable assembly and repeat production",
    mustInclude: ["FR-4 material options", "surface finish choice", "solder mask and silkscreen", "electrical test"],
    metrics: [["Scope", "Single-sided, double-sided and multilayer rigid PCBs"], ["Common finishes", "HASL, lead-free HASL, ENIG or other finishes by request"], ["Buyer value", "Reliable baseline for most electronic products"]],
    image: imageMap.manufacturing
  },
  "/pcb-manufacturing/flexible-pcb/": {
    category: "flex",
    label: "Flexible PCB",
    h1: "Flexible PCB Manufacturing for Compact and Moving Assemblies",
    title: "Flexible PCB Manufacturing | Flex Circuit Supplier | XFPCB",
    description: "XFPCB manufactures flexible PCBs with polyimide materials, coverlay, bend-area review and assembly-aware engineering support.",
    keywords: ["flexible PCB", "flex PCB manufacturer", "flex circuit", "flexible circuit board"],
    focus: "supporting boards that must fold, bend or fit into limited space while maintaining stable electrical performance",
    mustInclude: ["polyimide base material", "coverlay openings", "bend radius", "stiffener and assembly area review"],
    metrics: [["Best use", "Wearables, medical devices, sensors, displays and compact modules"], ["Design concern", "Keep copper away from sharp bend stress"], ["XFPCB value", "Review the flex area before tooling"]],
    image: imageMap.flex
  },
  "/pcb-manufacturing/flexible-pcb/single-layer-flexible-pcb/": {
    category: "flex",
    label: "Single Layer Flexible PCB",
    h1: "Single Layer Flexible PCB for Simple, Bendable Interconnects",
    title: "Single Layer Flexible PCB Manufacturing | XFPCB",
    description: "XFPCB builds single layer flexible PCBs for lightweight interconnects, sensor tails, display links and compact electronic products.",
    keywords: ["single layer flexible PCB", "single sided flex PCB", "flex circuit manufacturer"],
    focus: "keeping flexible interconnects thin, economical and reliable for low-complexity routing",
    mustInclude: ["one copper layer", "coverlay and stiffener choice", "bend area review", "cost control"],
    metrics: [["Structure", "One conductive layer on polyimide"], ["Buyer benefit", "Thin profile and simple routing"], ["Key instruction", "Mark stiffener location and connector zones"]],
    image: imageMap.flex
  },
  "/pcb-manufacturing/flexible-pcb/double-sided-flex-pcb/": {
    category: "flex",
    label: "Double-Sided Flex PCB",
    h1: "Double-Sided Flex PCB Manufacturing for Denser Flexible Routing",
    title: "Double-Sided Flex PCB Manufacturing | XFPCB",
    description: "XFPCB manufactures double-sided flex PCBs where routing density, vias, stiffeners and bend reliability must be balanced carefully.",
    keywords: ["double-sided flex PCB", "double layer flex circuit", "flex PCB manufacturer"],
    focus: "adding routing capacity to flex circuits while controlling via placement and mechanical stress",
    mustInclude: ["two copper layers", "via placement", "bend radius", "stiffener and connector review"],
    metrics: [["Structure", "Copper on both sides of the flexible dielectric"], ["Common need", "More routing without moving to a rigid-flex design"], ["Risk", "Do not place vias in dynamic bend zones unless reviewed"]],
    image: imageMap.flex
  },
  "/pcb-manufacturing/flexible-pcb/multilayer-flex-pcb/": {
    category: "flex",
    label: "Multilayer Flexible PCB",
    h1: "Multilayer Flexible PCB for Compact High-Density Products",
    title: "Multilayer Flexible PCB Manufacturing | XFPCB",
    description: "XFPCB supports multilayer flexible PCB projects that need more routing density, controlled stackups and careful mechanical design review.",
    keywords: ["multilayer flexible PCB", "multilayer flex circuit", "high density flex PCB"],
    focus: "combining multiple copper layers with controlled flex areas for dense products that cannot use a simple flex tail",
    mustInclude: ["stackup review", "stiffener planning", "dynamic versus static bending", "copper balance"],
    metrics: [["Best fit", "Cameras, medical modules, compact instruments and sensors"], ["Engineering concern", "Layer count increases stiffness"], ["XFPCB review", "Confirm bending use before production"]],
    image: imageMap.flex
  },
  "/pcb-manufacturing/rigid-flex-pcb/": {
    category: "flex",
    label: "Rigid-Flex PCB",
    h1: "Rigid-Flex PCB Manufacturing for Integrated 3D Assemblies",
    title: "Rigid-Flex PCB Manufacturing | Rigid Flex PCB Supplier | XFPCB",
    description: "XFPCB manufactures rigid-flex PCBs for products that need rigid component areas, flexible interconnects and compact assembly integration.",
    keywords: ["rigid-flex PCB", "rigid flex PCB manufacturer", "rigid flexible PCB", "rigid-flex circuit"],
    focus: "replacing connectors and harnesses with an integrated board that combines rigid sections and flexible transitions",
    mustInclude: ["rigid to flex transition", "stackup planning", "bend relief", "assembly panelization"],
    metrics: [["Best fit", "Compact equipment, aerospace-style modules, medical electronics and instruments"], ["Main risk", "Poor transition design causes cracking"], ["Buyer action", "Share 3D bend direction and enclosure limits"]],
    image: imageMap.flex
  },
  "/pcb-manufacturing/metal-core-pcb/": {
    category: "thermal",
    label: "Metal Core PCB",
    h1: "Metal Core PCB Manufacturing for Heat-Generating Electronics",
    title: "Metal Core PCB Manufacturing | MCPCB Supplier | XFPCB",
    description: "XFPCB manufactures metal core PCBs for LED, power conversion and thermal applications where heat transfer and dielectric reliability matter.",
    keywords: ["metal core PCB", "MCPCB manufacturer", "thermal PCB", "metal substrate PCB"],
    focus: "moving heat away from components through metal substrates, dielectric selection and thermal layout review",
    mustInclude: ["aluminum or copper substrate", "thermal dielectric", "LED and power device layout", "surface finish review"],
    metrics: [["Material", "Aluminum core, copper core or project-specific metal substrate"], ["Thermal concern", "Dielectric thickness and thermal conductivity"], ["Best use", "LED lighting, power modules and motor control"]],
    image: imageMap.thermal
  },
  "/pcb-manufacturing/aluminum-pcbs/": {
    category: "thermal",
    label: "Aluminum PCB",
    h1: "Aluminum PCB Manufacturing for LED and Power Products",
    title: "Aluminum PCB Manufacturing | LED Metal Core PCB | XFPCB",
    description: "XFPCB builds aluminum PCBs for LED lighting, power electronics and thermal products that need cost-effective heat spreading.",
    keywords: ["aluminum PCB", "aluminum PCB manufacturer", "LED aluminum PCB", "metal core PCB"],
    focus: "balancing thermal transfer, cost and manufacturability for LED boards and power electronic modules",
    mustInclude: ["aluminum substrate", "thermal dielectric", "LED thermal path", "panel and finish selection"],
    metrics: [["Typical use", "LED strips, lamps, drivers and power boards"], ["Buyer question", "Thermal conductivity and board thickness"], ["XFPCB value", "Cost-effective thermal PCB production"]],
    image: imageMap.thermal
  },
  "/pcb-manufacturing/led-pcb-board/": {
    category: "thermal",
    label: "LED PCB Board",
    h1: "LED PCB Board Manufacturing for Reliable Lighting Products",
    title: "LED PCB Board Manufacturing | LED PCB Supplier | XFPCB",
    description: "XFPCB manufactures LED PCB boards with thermal substrate review, solderability control and production support for lighting applications.",
    keywords: ["LED PCB board", "LED PCB manufacturer", "LED aluminum PCB", "LED circuit board"],
    focus: "supporting lighting products where heat, solderability, color consistency and repeat supply influence field reliability",
    mustInclude: ["thermal path", "LED polarity", "solder mask color", "panelization for lighting boards"],
    metrics: [["Application", "Indoor lighting, outdoor lighting, signage and LED modules"], ["Main risk", "Heat buildup shortens LED life"], ["Related page", "Use aluminum PCB or copper core PCB when thermal load increases"]],
    image: imageMap.thermal
  },
  "/pcb-manufacturing/copper-based-pcb/": {
    category: "thermal",
    label: "Copper Core PCB",
    h1: "Copper Core PCB Manufacturing for High Thermal Loads",
    title: "Copper Core PCB Manufacturing | High Thermal PCB | XFPCB",
    description: "XFPCB supports copper core PCB projects where heat spreading, current handling and compact power density are more demanding than aluminum PCB.",
    keywords: ["copper core PCB", "copper based PCB", "copper substrate PCB", "thermal PCB manufacturer"],
    focus: "using copper substrate solutions where high thermal conductivity and current handling justify the added manufacturing cost",
    mustInclude: ["copper substrate", "thermal management", "power electronics", "cost versus performance review"],
    metrics: [["Best use", "High power LEDs, converters, motor controllers and heat-sensitive modules"], ["Difference", "Copper transfers heat better than aluminum but costs more"], ["Buyer action", "Share power loss and heat sink assumptions"]],
    image: imageMap.thermal
  },
  "/pcb-manufacturing/heavy-copper-pcb/": {
    category: "thermal",
    label: "Heavy Copper PCB",
    h1: "Heavy Copper PCB Manufacturing for High Current Applications",
    title: "Heavy Copper PCB Manufacturing | High Current PCB Supplier | XFPCB",
    description: "XFPCB manufactures heavy copper PCBs for high current, power control and rugged products that need thicker copper and careful etching control.",
    keywords: ["heavy copper PCB", "high current PCB", "thick copper PCB", "heavy copper PCB manufacturer"],
    focus: "supporting high-current circuits where copper thickness, spacing, heat and plating consistency determine reliability",
    mustInclude: ["2 oz and thicker copper discussion", "current path review", "etching compensation", "thermal stress control"],
    metrics: [["Common copper", "2 oz, 3 oz and project-specific copper weights"], ["Application", "Power supplies, battery systems, motor drives and industrial control"], ["Risk", "Heavy copper changes trace geometry and solder mask behavior"]],
    image: imageMap.thermal
  },
  "/pcb-manufacturing/high-tg-pcb/": {
    category: "specialty",
    label: "High Tg PCB",
    h1: "High Tg PCB Manufacturing for Heat and Reliability Demands",
    title: "High Tg PCB Manufacturing | High Temperature PCB Supplier | XFPCB",
    description: "XFPCB manufactures High Tg PCBs for lead-free assembly, automotive electronics, industrial control and other higher temperature applications.",
    keywords: ["High Tg PCB", "high temperature PCB", "High Tg PCB manufacturer", "Tg 170 PCB"],
    focus: "choosing materials with higher glass transition temperature when operating temperature or reflow stress demands more stability",
    mustInclude: ["Tg selection", "lead-free reflow compatibility", "thermal cycling", "material availability"],
    metrics: [["Typical material", "Tg 150, Tg 170 or higher depending on the design"], ["Best use", "Automotive, industrial, power and LED control boards"], ["Buyer action", "Share operating temperature and assembly profile"]],
    image: imageMap.specialty
  },
  "/pcb-manufacturing/pcb-mass-production/": {
    category: "manufacturing",
    label: "PCB Mass Production",
    h1: "PCB Mass Production with NPI Review and Repeat Control",
    title: "PCB Mass Production | Volume PCB Manufacturing | XFPCB",
    description: "XFPCB supports PCB mass production after prototype validation with documentation control, panel planning, inspection and recurring supply communication.",
    keywords: ["PCB mass production", "volume PCB manufacturing", "PCB production", "mass production PCB supplier"],
    focus: "moving from approved samples into stable repeat production with controlled tooling, documentation and quality checks",
    mustInclude: ["NPI handoff", "panelization", "lot traceability", "repeat order control"],
    metrics: [["Before mass production", "Confirm sample approval and engineering change status"], ["Production focus", "Yield, consistency, packaging and delivery planning"], ["Buyer value", "Fewer surprises after the first production lot"]],
    image: imageMap.manufacturing
  },
  "/pcb-assembly/": {
    category: "assembly",
    label: "PCB Assembly",
    h1: "PCB Assembly Services for SMT, THT and Turnkey Builds",
    title: "PCB Assembly Services | SMT and Turnkey PCB Assembly | XFPCB",
    description: "XFPCB provides PCB assembly services including SMT, through-hole, mixed technology, component sourcing, inspection and turnkey PCBA support.",
    keywords: ["PCB assembly", "PCB assembly service", "PCB assembly manufacturer", "turnkey PCB assembly"],
    focus: "connecting bare PCB fabrication, component sourcing, SMT placement, through-hole assembly and inspection under one workflow",
    mustInclude: ["BOM review", "SMT and THT assembly", "AOI and X-ray options", "turnkey coordination"],
    metrics: [["Assembly scope", "Prototype, low-volume and repeat production PCBA"], ["Files needed", "Gerber, BOM, pick-and-place, assembly drawing and test notes"], ["XFPCB advantage", "Fabrication and assembly can be reviewed together"]],
    image: imageMap.assembly
  },
  "/pcb-assembly/smt-pcb-assembly/": {
    category: "assembly",
    label: "SMT PCB Assembly",
    h1: "SMT PCB Assembly for Fine-Pitch and Production Boards",
    title: "SMT PCB Assembly Service | Surface Mount Assembly | XFPCB",
    description: "XFPCB provides SMT PCB assembly for fine-pitch ICs, passives, LEDs, QFN, BGA and mixed production needs with BOM and process review.",
    keywords: ["SMT PCB assembly", "surface mount assembly", "SMT assembly manufacturer", "SMT PCBA"],
    focus: "managing solder paste printing, pick-and-place, reflow and AOI for reliable surface mount assemblies",
    mustInclude: ["stencil aperture review", "component package check", "reflow profile", "AOI inspection"],
    metrics: [["Components", "Resistors, capacitors, ICs, QFN, BGA, LEDs and connectors"], ["Process", "Stencil printing, placement, reflow and inspection"], ["Buyer action", "Provide BOM with MPNs and pick-and-place file"]],
    image: imageMap.smt
  },
  "/pcb-assembly/through-hole-pcb-assembly/": {
    category: "assembly",
    label: "Through-Hole PCB Assembly",
    h1: "Through-Hole PCB Assembly for Strong Mechanical Connections",
    title: "Through-Hole PCB Assembly Service | THT Assembly | XFPCB",
    description: "XFPCB supports through-hole PCB assembly for connectors, terminals, transformers, relays and other components needing mechanical strength.",
    keywords: ["through-hole PCB assembly", "THT assembly", "through hole assembly service", "PCB assembly manufacturer"],
    focus: "assembling parts that require mechanical retention, lead forming, selective soldering or hand solder process control",
    mustInclude: ["connector and terminal review", "wave or selective solder planning", "lead trimming", "visual inspection"],
    metrics: [["Typical parts", "Connectors, relays, transformers, switches and terminal blocks"], ["Assembly detail", "Lead length, orientation and solder fillet quality"], ["Best pairing", "Often combined with SMT in mixed technology PCBA"]],
    image: imageMap.assembly
  },
  "/pcb-assembly/mixed-technology-pcb-assembly-services/": {
    category: "assembly",
    label: "Mixed Technology PCB Assembly",
    h1: "Mixed Technology PCB Assembly for SMT and Through-Hole Boards",
    title: "Mixed Technology PCB Assembly Service | XFPCB",
    description: "XFPCB handles mixed technology PCB assembly where SMT components and through-hole parts must be sequenced, inspected and tested together.",
    keywords: ["mixed technology PCB assembly", "SMT THT assembly", "mixed assembly service", "PCBA manufacturer"],
    focus: "coordinating SMT reflow, through-hole soldering, mechanical parts and inspection so the assembly sequence protects the board",
    mustInclude: ["SMT plus THT sequence", "mechanical component review", "assembly drawing", "inspection after each stage"],
    metrics: [["Common boards", "Power controllers, industrial interfaces, LED drivers and communication modules"], ["Risk", "Large THT parts can limit panel or reflow options"], ["Buyer action", "Mark DNP and hand-soldered parts clearly"]],
    image: imageMap.assembly
  },
  "/pcb-assembly/lead-free-pcb-assembly-service/": {
    category: "assembly",
    label: "Lead-Free PCB Assembly",
    h1: "Lead-Free PCB Assembly for RoHS-Oriented Products",
    title: "Lead-Free PCB Assembly Service | RoHS PCBA | XFPCB",
    description: "XFPCB provides lead-free PCB assembly support with surface finish, component, reflow and solderability review for RoHS-oriented electronics.",
    keywords: ["lead-free PCB assembly", "RoHS PCB assembly", "lead free PCBA", "lead-free assembly service"],
    focus: "controlling solderability and thermal profile when lead-free alloys increase assembly temperature and process sensitivity",
    mustInclude: ["lead-free surface finish", "SAC solder profile", "RoHS component review", "thermal sensitivity"],
    metrics: [["Common finish", "ENIG, lead-free HASL or other lead-free finishes"], ["Assembly concern", "Higher reflow temperature affects PCB and components"], ["Buyer action", "Confirm compliance expectations in the RFQ"]],
    image: imageMap.quality
  },
  "/pcb-assembly/fast-prototype-pcb-assembly-service/": {
    category: "assembly",
    label: "Prototype PCB Assembly",
    h1: "Prototype PCB Assembly for Fast Design Verification",
    title: "Prototype PCB Assembly Service | Fast Prototype PCBA | XFPCB",
    description: "XFPCB helps buyers build prototype PCB assemblies with BOM review, PCB fabrication coordination, SMT/THT assembly and inspection planning.",
    keywords: ["prototype PCB assembly", "fast prototype PCBA", "prototype PCBA manufacturer", "small batch PCB assembly"],
    focus: "helping engineering teams validate a circuit with a small assembled lot before scaling into production",
    mustInclude: ["BOM readiness", "small batch SMT", "functional test notes", "engineering change feedback"],
    metrics: [["Best use", "EVT, DVT, pilot run and engineering validation"], ["Needed files", "Gerber, BOM, pick-and-place and assembly drawing"], ["Buyer benefit", "One feedback loop for PCB and assembly issues"]],
    image: imageMap.smt
  },
  "/pcb-assembly/quick-turn-pcb-assembly/": {
    category: "assembly",
    label: "Quick Turn PCB Assembly",
    h1: "Quick Turn PCB Assembly When Schedule Matters",
    title: "Quick Turn PCB Assembly Service | Fast PCBA Supplier | XFPCB",
    description: "XFPCB supports quick turn PCB assembly when complete files, available components and practical inspection requirements make a fast build possible.",
    keywords: ["quick turn PCB assembly", "fast PCB assembly", "quick turn PCBA", "rapid PCBA service"],
    focus: "shortening assembly schedule by verifying files, BOM availability, stencil data and inspection needs before launch",
    mustInclude: ["component availability", "complete placement data", "stencil preparation", "priority communication"],
    metrics: [["Schedule depends on", "BOM availability, board complexity, quantity and test scope"], ["Fastest path", "Approve substitutes and questions quickly"], ["Risk", "Incomplete files slow a quick-turn job more than factory speed"]],
    image: imageMap.smt
  },
  "/pcb-assembly/low-cost-pcb-assembly/": {
    category: "assembly",
    label: "Low-Cost PCB Assembly",
    h1: "Low-Cost PCB Assembly with Transparent Cost Drivers",
    title: "Low-Cost PCB Assembly Service | Affordable PCBA | XFPCB",
    description: "XFPCB helps PCBA buyers reduce assembly cost through BOM review, panel planning, process simplification and practical turnkey sourcing.",
    keywords: ["low-cost PCB assembly", "affordable PCB assembly", "low cost PCBA", "PCB assembly supplier"],
    focus: "reducing assembly cost by controlling BOM choices, placement complexity, panel efficiency and avoidable manual work",
    mustInclude: ["BOM alternatives", "placement efficiency", "stencil and panel optimization", "test scope discussion"],
    metrics: [["Cost drivers", "Number of placements, fine-pitch parts, BOM sourcing, test and manual steps"], ["Good saving", "Use approved alternates and production panel planning"], ["Bad saving", "Skipping needed inspection for risky components"]],
    image: imageMap.assembly
  },
  "/pcb-assembly/full-turnkey-pcb-assembly-service/": {
    category: "assembly",
    label: "Turnkey PCB Assembly",
    h1: "Full and Partial Turnkey PCB Assembly with One Accountable Supplier",
    title: "Turnkey PCB Assembly Service | Full and Partial PCBA | XFPCB",
    description: "XFPCB provides full and partial turnkey PCB assembly, coordinating PCB fabrication, component sourcing, SMT/THT assembly and inspection.",
    keywords: ["turnkey PCB assembly", "full turnkey PCB assembly", "partial turnkey PCB assembly", "turnkey PCBA manufacturer"],
    focus: "reducing handoff risk by keeping bare PCB manufacturing, component sourcing and assembly communication together",
    mustInclude: ["PCB fabrication", "component sourcing", "SMT and THT", "inspection and test options"],
    metrics: [["Full turnkey", "XFPCB manages PCB, sourcing and assembly"], ["Partial turnkey", "Buyer supplies selected components"], ["Buyer benefit", "Fewer supplier handoffs and clearer responsibility"]],
    image: imageMap.assembly
  },
  "/pcb-assembly/low-volume-assembly-service/": {
    category: "assembly",
    label: "Low Volume PCB Assembly",
    h1: "Low Volume PCB Assembly for Pilot Runs and Specialized Products",
    title: "Low Volume PCB Assembly Service | Small Batch PCBA | XFPCB",
    description: "XFPCB supports low volume PCB assembly for pilot runs, specialized products, industrial electronics and projects before full production release.",
    keywords: ["low volume PCB assembly", "small batch PCBA", "low volume PCBA", "prototype to production assembly"],
    focus: "building small and repeatable PCBA lots when the project needs manufacturing discipline without high-volume tooling commitments",
    mustInclude: ["pilot production", "controlled documentation", "engineering feedback", "flexible sourcing"],
    metrics: [["Best fit", "Pilot lots, industrial products and specialized electronics"], ["Process focus", "Repeatability matters even at low quantity"], ["Buyer action", "Clarify whether this is one-time or recurring demand"]],
    image: imageMap.assembly
  },
  "/pcb-assembly/high-volume-pcb-assembly-services/": {
    category: "assembly",
    label: "High Volume PCB Assembly",
    h1: "High Volume PCB Assembly with Production Planning and Quality Control",
    title: "High Volume PCB Assembly Services | Production PCBA | XFPCB",
    description: "XFPCB supports high volume PCB assembly projects with production planning, sourcing coordination, process control and inspection strategy.",
    keywords: ["high volume PCB assembly", "production PCBA", "volume PCB assembly", "PCBA production supplier"],
    focus: "scaling from approved prototypes to repeat production with stable BOM sourcing, panel planning, inspection and delivery scheduling",
    mustInclude: ["production ramp", "BOM stability", "process control", "fixture and test planning"],
    metrics: [["Before ramp", "Freeze files and approve first articles"], ["Production concern", "Component supply and process yield"], ["Buyer value", "One plan for quality, delivery and cost control"]],
    image: imageMap.quality
  },
  "/pcb-assembly/led-pcb-assembly/": {
    category: "assembly",
    label: "LED PCB Assembly",
    h1: "LED PCB Assembly for Lighting and Power Modules",
    title: "LED PCB Assembly Service | LED PCBA Supplier | XFPCB",
    description: "XFPCB assembles LED PCBs with polarity review, thermal PCB support, solderability control and inspection for lighting applications.",
    keywords: ["LED PCB assembly", "LED PCBA", "LED assembly service", "LED PCB manufacturer"],
    focus: "assembling LED boards where polarity, thermal path, solder joints and consistent production quality affect product life",
    mustInclude: ["LED polarity", "thermal substrate", "solder joint inspection", "lighting module production"],
    metrics: [["Common boards", "Aluminum LED PCBs, lighting strips, modules and drivers"], ["Risk", "Thermal or polarity errors cause early failure"], ["Related service", "Use aluminum PCB manufacturing for heat transfer"]],
    image: imageMap.thermal
  },
  "/pcb-assembly/components-purchasing-services/": {
    category: "sourcing",
    label: "Component Sourcing",
    h1: "Electronic Component Sourcing for Turnkey PCBA Projects",
    title: "Component Sourcing Service | PCB Assembly Purchasing | XFPCB",
    description: "XFPCB supports component sourcing for PCBA projects with BOM review, package verification, alternates discussion and turnkey assembly planning.",
    keywords: ["component sourcing", "components purchasing service", "PCB assembly sourcing", "turnkey PCBA sourcing"],
    focus: "reducing BOM risk before assembly by checking availability, packages, substitutions and purchasing assumptions",
    mustInclude: ["BOM review", "manufacturer part numbers", "approved alternates", "package and lifecycle checks"],
    metrics: [["Needed from buyer", "BOM with MPN, quantity, reference designators and approved alternates"], ["Risk", "Wrong package or lifecycle status can stop assembly"], ["Buyer value", "Sourcing and assembly questions are handled together"]],
    image: imageMap.sourcing
  },
  "/pcb-assembly/pcb-smt-stencil/": {
    category: "stencil",
    label: "PCB SMT Stencil",
    h1: "PCB SMT Stencil Support for Reliable Solder Paste Printing",
    title: "PCB SMT Stencil | Solder Paste Stencil Service | XFPCB",
    description: "XFPCB provides PCB SMT stencil support for prototype and assembly projects, including aperture, thickness and panel requirements review.",
    keywords: ["PCB SMT stencil", "SMT stencil", "solder paste stencil", "PCB stencil supplier"],
    focus: "helping solder paste printing match component size, pad geometry and assembly yield requirements",
    mustInclude: ["stencil thickness", "aperture reduction", "fiducials", "frame or frameless option"],
    metrics: [["Use case", "SMT assembly, prototype PCBA and production paste printing"], ["Critical detail", "Fine-pitch parts need aperture review"], ["Buyer action", "Send paste layer and assembly drawing"]],
    image: imageMap.sourcing
  },
  "/laser-cut-smt-stencil/": {
    category: "stencil",
    label: "Laser Cut SMT Stencil",
    h1: "Laser Cut SMT Stencils for Accurate Solder Paste Deposition",
    title: "Laser Cut SMT Stencil Manufacturing | XFPCB",
    description: "XFPCB supports laser cut SMT stencils for prototype and production assembly with aperture, thickness and frame requirements reviewed.",
    keywords: ["laser cut SMT stencil", "SMT stencil manufacturer", "laser stencil", "solder paste stencil"],
    focus: "using clean laser-cut apertures to improve paste release for common SMT and fine-pitch component footprints",
    mustInclude: ["laser cut apertures", "paste release", "stencil frame choice", "fine pitch review"],
    metrics: [["Best fit", "Prototype PCBA, SMT lines and repeat assembly"], ["Buyer option", "Framed or frameless stencil"], ["Needed file", "Paste layer or stencil Gerber"]],
    image: imageMap.sourcing
  },
  "/step-stencil/": {
    category: "stencil",
    label: "Step Stencil",
    h1: "Step Stencils for Mixed Component Height and Paste Volume Needs",
    title: "Step Stencil Manufacturing | SMT Step-Up Step-Down Stencil | XFPCB",
    description: "XFPCB supports step stencils when a PCB assembly needs different solder paste volumes for fine-pitch and large components on the same board.",
    keywords: ["step stencil", "step-up stencil", "step-down stencil", "SMT stencil manufacturer"],
    focus: "balancing paste volume across components that need different solder deposits without changing the PCB design",
    mustInclude: ["step-up and step-down areas", "fine-pitch ICs", "large connectors", "paste volume control"],
    metrics: [["Use case", "Boards mixing small QFN or BGA with larger terminals or shields"], ["Design need", "Clear step area drawing"], ["Assembly value", "Reduce opens and bridges caused by one stencil thickness"]],
    image: imageMap.sourcing
  },
  "/nano-coating-pcb-stencil-manufacturing/": {
    category: "stencil",
    label: "Nano-Coating PCB Stencil",
    h1: "Nano-Coating PCB Stencils for Better Paste Release",
    title: "Nano-Coating PCB Stencil Manufacturing | XFPCB",
    description: "XFPCB supports nano-coated PCB stencils for SMT assemblies that need cleaner paste release and more stable printing on fine apertures.",
    keywords: ["nano coating PCB stencil", "nano-coated SMT stencil", "PCB stencil manufacturing", "fine pitch stencil"],
    focus: "improving paste release and reducing cleaning sensitivity for fine-pitch and dense SMT assemblies",
    mustInclude: ["nano coating", "fine aperture release", "cleaner printing", "SMT yield support"],
    metrics: [["Best fit", "Fine-pitch ICs, dense SMT boards and small passives"], ["Benefit", "More consistent paste transfer"], ["Buyer action", "Flag fine-pitch or small aperture areas"]],
    image: imageMap.sourcing
  },
  "/custom-electroform-stencils/": {
    category: "stencil",
    label: "Electroform Stencils",
    h1: "Custom Electroform Stencils for Demanding SMT Printing",
    title: "Custom Electroform Stencils | Precision SMT Stencil | XFPCB",
    description: "XFPCB supports custom electroform stencil requirements for dense SMT assemblies where aperture wall quality and paste release are critical.",
    keywords: ["electroform stencil", "custom electroform stencil", "precision SMT stencil", "fine pitch stencil"],
    focus: "using high-precision stencil options when dense assemblies need exceptional aperture quality and paste transfer consistency",
    mustInclude: ["electroformed apertures", "fine-pitch assembly", "custom stencil design", "paste transfer"],
    metrics: [["Best fit", "Dense SMT, micro components and advanced prototypes"], ["Reason to choose", "Aperture wall quality and paste release"], ["Needed data", "Paste layer, thickness and special aperture notes"]],
    image: imageMap.sourcing
  },
  "/pcb-manufacturer/": {
    category: "company",
    label: "China PCB Manufacturer",
    h1: "China PCB Manufacturer for Global PCB and PCBA Buyers",
    title: "China PCB Manufacturer | XFPCB Factory and Assembly Partner",
    description: "XFPCB is a China PCB manufacturer supporting PCB fabrication, advanced boards, PCBA, sourcing and inspection for global electronics buyers.",
    keywords: ["China PCB manufacturer", "PCB manufacturer in China", "PCB factory China", "PCBA manufacturer"],
    focus: "helping buyers consolidate PCB fabrication, advanced board options, PCBA support and responsive engineering communication",
    mustInclude: ["direct factory communication", "PCB and PCBA support", "advanced board capability", "export-oriented service"],
    metrics: [["Manufacturing scope", "PCB fabrication, PCBA, stencils, inspection and sourcing support"], ["Buyer type", "Engineers, purchasing managers and product companies"], ["Trust signal", "Clear RFQ review before production"]],
    image: imageMap.company
  },
  "/pcb-manufacturer/pcb-manufacturer-in-china/": {
    category: "company",
    label: "PCB Manufacturer in China",
    h1: "PCB Manufacturer in China with Engineering-First Communication",
    title: "PCB Manufacturer in China | PCB Fabrication and PCBA | XFPCB",
    description: "XFPCB helps overseas buyers source PCB manufacturing in China with DFM review, advanced capabilities, PCBA support and practical RFQ handling.",
    keywords: ["PCB manufacturer in China", "China PCB supplier", "Chinese PCB manufacturer", "PCB fabrication China"],
    focus: "combining cost efficiency with engineering review so international buyers can source from China with fewer surprises",
    mustInclude: ["international RFQ communication", "DFM feedback", "prototype and production", "shipping planning"],
    metrics: [["Why China", "Broad process capability and supply chain depth"], ["Why XFPCB", "PCB and PCBA discussion in one workflow"], ["Buyer action", "Send full files and required standards up front"]],
    image: imageMap.company
  },
  "/pcb-manufacturer/pcb-factory/": {
    category: "company",
    label: "PCB Factory",
    h1: "PCB Factory Support for Fabrication, Assembly and Repeat Orders",
    title: "PCB Factory in China | Direct PCB Manufacturing | XFPCB",
    description: "XFPCB provides direct PCB factory support for prototype, production, advanced boards, PCBA and sourcing projects for global buyers.",
    keywords: ["PCB factory", "PCB factory China", "direct PCB manufacturer", "PCB production factory"],
    focus: "giving buyers a direct manufacturing route for quoting, engineering review, production planning and repeat order communication",
    mustInclude: ["factory-direct RFQ", "production documentation", "capability review", "quality inspection"],
    metrics: [["Factory role", "Review files, manufacture boards, coordinate assembly and support repeat orders"], ["Buyer value", "Fewer layers between engineering and production"], ["Best practice", "Control revisions and approved files carefully"]],
    image: imageMap.company
  },
  "/pcb-manufacturer/quality-management/": {
    category: "quality",
    label: "PCB Quality Management",
    h1: "PCB Quality Management from File Review to Final Inspection",
    title: "PCB Quality Management | PCB and PCBA Inspection | XFPCB",
    description: "XFPCB uses practical quality management across file review, fabrication, assembly, inspection and shipment communication for PCB projects.",
    keywords: ["PCB quality management", "PCB inspection", "PCBA quality control", "PCB manufacturer quality"],
    focus: "making quality visible through engineering checks, process control, electrical testing, assembly inspection and issue communication",
    mustInclude: ["CAM review", "in-process inspection", "electrical test", "AOI and X-ray when relevant"],
    metrics: [["Quality starts", "Before production with clear files and assumptions"], ["Inspection options", "Visual, AOI, electrical test, flying probe and X-ray for assemblies"], ["Buyer action", "Define acceptance criteria and test expectations"]],
    image: imageMap.quality
  },
  "/pcb-manufacturer/why-us/": {
    category: "company",
    label: "Why Choose XFPCB",
    h1: "Why Choose XFPCB for PCB Manufacturing and PCBA",
    title: "Why Choose XFPCB | PCB Manufacturing and Assembly Partner",
    description: "Choose XFPCB for PCB fabrication, advanced board options, PCBA support, engineering communication and practical supply chain coordination.",
    keywords: ["why choose XFPCB", "PCB manufacturer", "PCB assembly supplier", "China PCB factory"],
    focus: "showing how XFPCB helps buyers reduce sourcing risk with engineering review, broad capability and clear production communication",
    mustInclude: ["PCB and PCBA under one workflow", "advanced PCB experience", "responsive engineering", "global buyer support"],
    metrics: [["For engineers", "DFM questions are discussed before build"], ["For purchasing", "Quotation assumptions are made visible"], ["For repeat orders", "Documentation and process notes stay organized"]],
    image: imageMap.company
  },
  "/technical-capabilities/": {
    category: "capability",
    label: "PCB Manufacturing Capabilities",
    h1: "PCB Manufacturing Capabilities for Advanced Board Projects",
    title: "PCB Manufacturing Capabilities | XFPCB Technical Capability",
    description: "Review XFPCB PCB manufacturing capabilities for rigid, flex, rigid-flex, HDI, copper thickness, PCBA, stencil and inspection requirements.",
    keywords: ["PCB manufacturing capabilities", "PCB technical capability", "PCB fabrication capability", "PCBA capability"],
    focus: "helping engineers check whether layer count, materials, copper, vias, finish, assembly and inspection expectations are feasible",
    mustInclude: ["rigid and flex capability", "HDI and controlled impedance", "copper thickness", "PCBA and inspection"],
    metrics: [["Board types", "Rigid, flexible, rigid-flex, HDI, metal core and multilayer PCBs"], ["Assembly", "SMT, THT, mixed technology and turnkey PCBA"], ["Quality", "Electrical test, AOI, flying probe and X-ray when required"]],
    image: imageMap.capability
  },
  "/pcb-fabrication-process/": {
    category: "capability",
    label: "PCB Fabrication Process",
    h1: "PCB Fabrication Process from CAM Review to Shipment",
    title: "PCB Fabrication Process | How XFPCB Builds Circuit Boards",
    description: "Understand the XFPCB PCB fabrication process, including file review, imaging, etching, lamination, drilling, plating, solder mask, test and packing.",
    keywords: ["PCB fabrication process", "PCB manufacturing process", "how PCBs are made", "PCB production process"],
    focus: "showing buyers what happens after Gerber files are approved and where quality control should appear in production",
    mustInclude: ["CAM review", "inner layer and lamination", "drilling and plating", "solder mask and electrical test"],
    metrics: [["Process value", "Each step affects final yield and reliability"], ["Buyer role", "Approve questions before tooling starts"], ["Documentation", "Keep revision and stackup data controlled"]],
    image: imageMap.capability
  },
  "/technical-capabilities/rigid-pcb-fabrication-capability/": {
    category: "capability",
    label: "Rigid PCB Capability",
    h1: "Rigid PCB Fabrication Capability for FR-4 and Multilayer Boards",
    title: "Rigid PCB Fabrication Capability | XFPCB",
    description: "XFPCB rigid PCB fabrication capability supports FR-4, multilayer, controlled impedance, surface finishes and production inspection.",
    keywords: ["rigid PCB fabrication capability", "FR4 PCB capability", "rigid PCB manufacturer"],
    focus: "matching rigid PCB design requirements with material, layer count, drill, copper, finish and inspection capability",
    mustInclude: ["FR-4 and high Tg", "multilayer stackups", "controlled impedance", "electrical test"],
    metrics: [["Typical boards", "Industrial control, communication, consumer and power products"], ["Design checks", "Drill, annular ring, trace/space and copper balance"], ["Link", "Use high-layer-count products for very complex multilayer projects"]],
    image: imageMap.capability
  },
  "/technical-capabilities/flexible-pcb-fabrication-capability/": {
    category: "capability",
    label: "Flexible PCB Capability",
    h1: "Flexible PCB Fabrication Capability for Reliable Bend Areas",
    title: "Flexible PCB Fabrication Capability | XFPCB",
    description: "XFPCB flexible PCB fabrication capability covers polyimide flex circuits, coverlay, stiffeners, bend-area review and assembly planning.",
    keywords: ["flexible PCB capability", "flex PCB fabrication capability", "flex circuit manufacturer"],
    focus: "checking whether the flex stackup, bend area, coverlay, stiffener and connector zone can survive the intended use",
    mustInclude: ["polyimide material", "coverlay", "stiffeners", "dynamic versus static bend review"],
    metrics: [["Flex concern", "Mechanical design is as important as electrical routing"], ["Needed data", "Bend radius, bend cycles and enclosure constraints"], ["Related service", "Rigid-flex PCB when flex and rigid sections are integrated"]],
    image: imageMap.flex
  },
  "/technical-capabilities/rigid-flex-pcb-fabrication-capability/": {
    category: "capability",
    label: "Rigid-Flex PCB Capability",
    h1: "Rigid-Flex PCB Fabrication Capability for Integrated Assemblies",
    title: "Rigid-Flex PCB Fabrication Capability | XFPCB",
    description: "XFPCB rigid-flex PCB capability supports stackup planning, flex transition review, compact assembly needs and advanced fabrication discussion.",
    keywords: ["rigid-flex PCB capability", "rigid flex PCB fabrication", "rigid-flex manufacturer"],
    focus: "confirming stackup, transition zones, bend relief, panelization and assembly flow before a rigid-flex order starts",
    mustInclude: ["rigid-flex stackup", "transition reliability", "bend relief", "assembly panel planning"],
    metrics: [["Benefit", "Reduce connectors and cables"], ["Risk", "Poor flex-to-rigid transition design"], ["Buyer action", "Share 3D model or bend sketch when possible"]],
    image: imageMap.flex
  },
  "/technical-capabilities/hdi-pcb-board-fabrication-capabilities/": {
    category: "capability",
    label: "HDI PCB Capability",
    h1: "HDI PCB Board Fabrication Capability for Dense Layouts",
    title: "HDI PCB Board Fabrication Capabilities | XFPCB",
    description: "XFPCB HDI PCB board fabrication capability supports dense BGA routing, microvia discussion, sequential lamination and engineering review.",
    keywords: ["HDI PCB fabrication capability", "HDI PCB capability", "microvia PCB capability", "HDI board manufacturer"],
    focus: "reviewing microvia structures, BGA fanout, via-in-pad, buried vias and lamination strategy before manufacturing",
    mustInclude: ["microvias", "blind and buried vias", "via-in-pad review", "sequential lamination planning"],
    metrics: [["Design driver", "Density and BGA pitch"], ["Cost driver", "Sequential lamination and via structure"], ["Buyer action", "Send stackup and BGA details early"]],
    image: imageMap.specialty
  },
  "/pcb-assembly/pcb-assembly-capability/": {
    category: "capability",
    label: "PCB Assembly Capability",
    h1: "PCB Assembly Capability for SMT, THT and Turnkey PCBA",
    title: "PCB Assembly Capability | SMT and Turnkey PCBA | XFPCB",
    description: "XFPCB PCB assembly capability includes SMT, through-hole, mixed technology, BOM sourcing support, inspection and turnkey PCBA coordination.",
    keywords: ["PCB assembly capability", "PCBA capability", "SMT assembly capability", "turnkey PCBA"],
    focus: "confirming whether component packages, BOM sourcing, placement, soldering and test expectations fit the assembly plan",
    mustInclude: ["SMT placement", "THT soldering", "BOM and sourcing review", "AOI and X-ray options"],
    metrics: [["Assembly types", "SMT, THT, mixed technology, prototype and production PCBA"], ["Files needed", "BOM, pick-and-place, assembly drawing and Gerber"], ["Quality", "Inspection matched to component risk"]],
    image: imageMap.smt
  },
  "/pcb-assembly/pcb-stencil-capability/": {
    category: "capability",
    label: "PCB SMT Stencil Capability",
    h1: "PCB SMT Stencil Capability for Prototype and Production Assembly",
    title: "PCB SMT Stencil Capability | XFPCB",
    description: "XFPCB SMT stencil capability supports laser cut stencils, step stencils, nano coating and electroform options for assembly requirements.",
    keywords: ["PCB stencil capability", "SMT stencil capability", "laser cut stencil", "step stencil"],
    focus: "matching stencil type, thickness and aperture strategy with component density and solder paste printing risk",
    mustInclude: ["laser cut stencil", "step stencil", "nano coating", "electroform stencil"],
    metrics: [["Stencil types", "Framed, frameless, step, nano-coated and electroform"], ["Design input", "Paste layer and special aperture notes"], ["Assembly value", "Better paste control for reliable soldering"]],
    image: imageMap.sourcing
  },
  "/technical-capabilities/pcb-copper-thickness-capabilities/": {
    category: "capability",
    label: "PCB Copper Thickness Capabilities",
    h1: "PCB Copper Thickness Capabilities for Signal, Power and Thermal Needs",
    title: "PCB Copper Thickness Capabilities | XFPCB",
    description: "XFPCB supports PCB copper thickness review for standard copper, heavy copper, thermal boards, high current paths and multilayer production.",
    keywords: ["PCB copper thickness", "PCB copper thickness capability", "heavy copper PCB", "copper weight PCB"],
    focus: "helping buyers choose copper weight that matches current, thermal and manufacturability requirements without over-specifying the board",
    mustInclude: ["standard copper", "heavy copper", "current carrying needs", "etching and spacing review"],
    metrics: [["Common copper", "1 oz, 2 oz, 3 oz and project-specific copper weights"], ["Cost driver", "Thicker copper affects etching, spacing and lamination"], ["Buyer action", "Share current and thermal assumptions"]],
    image: imageMap.thermal
  },
  "/applications-and-industries-served/": {
    category: "industry",
    label: "Industries Served",
    h1: "Industries Served by XFPCB PCB Manufacturing and Assembly",
    title: "Industries Served | PCB Manufacturing for Electronics Markets | XFPCB",
    description: "XFPCB supports PCB and PCBA projects for consumer, new energy, automotive, medical, industrial, communication, server, security and LED markets.",
    keywords: ["PCB industries served", "electronics PCB manufacturer", "PCBA industries", "custom PCB supplier"],
    focus: "showing how PCB fabrication, advanced boards and assembly support adapt to different electronics product risks",
    mustInclude: ["application-specific DFM", "material and reliability review", "prototype and production", "PCBA support"],
    metrics: [["Industries", "Consumer, energy, automotive, medical, industrial, communication, server, security and LED"], ["Buyer value", "One supplier can support several product lines"], ["RFQ tip", "Explain the operating environment, not only the board size"]],
    image: imageMap.industry
  },
  "/applications-and-industries-served/pcbs-for-consumer-electronics/": {
    category: "industry",
    label: "Consumer Electronics PCBs",
    h1: "PCBs for Consumer Electronics with Compact and Cost-Sensitive Design",
    title: "PCBs for Consumer Electronics | XFPCB",
    description: "XFPCB supports consumer electronics PCBs for compact devices, wearables, smart products and connected hardware with cost and assembly review.",
    keywords: ["consumer electronics PCB", "PCB for consumer electronics", "consumer PCB manufacturer"],
    focus: "balancing compact layout, cost control, cosmetic expectations, assembly yield and product launch schedules",
    mustInclude: ["compact routing", "cost-sensitive production", "SMT assembly", "prototype validation"],
    metrics: [["Product examples", "Smart devices, wearables, audio products and connected modules"], ["Design concern", "Small boards often need HDI, flex or fine-pitch assembly"], ["Buyer value", "Prototype quickly, then tune for volume cost"]],
    image: imageMap.industry
  },
  "/applications-and-industries-served/new-energy-pcbs/": {
    category: "industry",
    label: "New Energy PCBs",
    h1: "PCBs for New Energy Applications and Power Electronics",
    title: "New Energy PCBs | PCB Manufacturing for Energy Products | XFPCB",
    description: "XFPCB manufactures PCBs for new energy products including BMS, inverters, chargers, power control and monitoring electronics.",
    keywords: ["new energy PCB", "PCB for new energy", "BMS PCB", "power electronics PCB"],
    focus: "supporting power, thermal, isolation and reliability requirements in renewable energy and storage electronics",
    mustInclude: ["BMS and inverter boards", "thermal management", "creepage and clearance", "heavy copper and metal core options"],
    metrics: [["Applications", "BMS, inverters, chargers, converters and monitoring modules"], ["Risk", "Heat and high current need careful copper and spacing review"], ["Related capability", "Heavy copper, aluminum PCB and PCBA support"]],
    image: imageMap.thermal
  },
  "/applications-and-industries-served/new-energy-vehicle-pcb/": {
    category: "industry",
    label: "New Energy Vehicle PCB",
    h1: "New Energy Vehicle PCB Support for EV Electronics",
    title: "New Energy Vehicle PCB | EV PCB Manufacturing | XFPCB",
    description: "XFPCB supports new energy vehicle PCB projects for BMS, charging, lighting, control modules and power electronics with engineering review.",
    keywords: ["new energy vehicle PCB", "EV PCB", "automotive electronics PCB", "BMS PCB manufacturer"],
    focus: "supporting EV-related electronics where heat, vibration, power density and long-term reliability are major sourcing concerns",
    mustInclude: ["BMS boards", "charging electronics", "automotive environment review", "thermal and high current design"],
    metrics: [["Typical products", "BMS, chargers, DC-DC converters, LED lighting and control modules"], ["Engineering concern", "Thermal cycling and vibration affect PCB and assembly"], ["Buyer action", "Share operating environment and reliability expectations"]],
    image: imageMap.industry
  },
  "/applications-and-industries-served/pcbs-for-automobile-electronics/": {
    category: "industry",
    label: "Automobile Electronics PCBs",
    h1: "PCBs for Automobile Electronics and Control Modules",
    title: "PCBs for Automobile Electronics | XFPCB",
    description: "XFPCB manufactures PCBs for automobile electronics such as control modules, lighting, sensors, chargers and power-related systems.",
    keywords: ["automobile electronics PCB", "automotive PCB", "PCB for automotive electronics", "vehicle PCB"],
    focus: "helping vehicle electronics projects address thermal, vibration, traceability, assembly and repeat production needs",
    mustInclude: ["control modules", "LED and power boards", "quality documentation", "prototype to production"],
    metrics: [["Applications", "Lighting, sensors, controls, chargers and power modules"], ["Risk", "Automotive environments punish weak soldering and poor material choice"], ["XFPCB support", "Fabrication, assembly and inspection discussion in one RFQ"]],
    image: imageMap.industry
  },
  "/applications-and-industries-served/pcbs-for-medical-devices/": {
    category: "industry",
    label: "Medical Device PCBs",
    h1: "PCBs for Medical Devices with Traceable Manufacturing Communication",
    title: "PCBs for Medical Devices | Medical Electronics PCB Supplier | XFPCB",
    description: "XFPCB supports PCB and PCBA projects for medical electronics, monitoring devices, sensors and compact instruments with careful engineering review.",
    keywords: ["medical device PCB", "medical electronics PCB", "PCB for medical devices", "medical PCB manufacturer"],
    focus: "supporting medical electronics buyers who need compact layout, stable quality, documentation clarity and careful supplier communication",
    mustInclude: ["compact HDI or flex options", "documentation and revision control", "clean solderability", "inspection planning"],
    metrics: [["Applications", "Monitoring devices, diagnostic modules, sensors and portable instruments"], ["Risk", "Design revision confusion can be costly"], ["Buyer action", "Define documentation, test and packaging expectations early"]],
    image: imageMap.industry
  },
  "/applications-and-industries-served/pcbs-for-industrial-control-applications/": {
    category: "industry",
    label: "Industrial Control PCBs",
    h1: "PCBs for Industrial Control Applications and Long-Life Equipment",
    title: "PCBs for Industrial Control Applications | XFPCB",
    description: "XFPCB manufactures PCBs for industrial control, automation, instrumentation, power control and communication interfaces.",
    keywords: ["industrial control PCB", "PCB for industrial control", "industrial electronics PCB", "automation PCB"],
    focus: "supporting durable control boards where long lifecycle, connectors, power handling and repairability influence supplier choice",
    mustInclude: ["industrial controllers", "connectors and THT", "long-life production", "high current or high Tg options"],
    metrics: [["Applications", "PLC modules, drives, meters, controllers and industrial gateways"], ["Assembly concern", "Connectors and terminals often need through-hole strength"], ["Buyer value", "Stable repeat supply for product life cycles"]],
    image: imageMap.industry
  },
  "/applications-and-industries-served/pcbs-for-communication-equipment/": {
    category: "industry",
    label: "Communication Equipment PCBs",
    h1: "PCBs for Communication Equipment and High-Speed Signals",
    title: "PCBs for Communication Equipment | High-Speed PCB Supplier | XFPCB",
    description: "XFPCB supports communication equipment PCBs with controlled impedance, high-frequency materials, HDI options and multilayer fabrication.",
    keywords: ["communication equipment PCB", "telecom PCB", "high-speed PCB", "RF PCB manufacturer"],
    focus: "supporting routers, modules, RF equipment and communication boards where impedance, material and stackup drive performance",
    mustInclude: ["controlled impedance", "high-frequency material", "HDI and BGA routing", "multilayer stackup"],
    metrics: [["Applications", "Network modules, RF boards, routers and communication controllers"], ["Signal concern", "Impedance and material loss affect performance"], ["Related capability", "High-frequency PCB and impedance control PCB"]],
    image: imageMap.specialty
  },
  "/applications-and-industries-served/server-and-data-storage-pcbs/": {
    category: "industry",
    label: "Server and Data Storage PCBs",
    h1: "Server and Data Storage PCBs for Dense High-Speed Hardware",
    title: "Server and Data Storage PCBs | High Layer PCB Supplier | XFPCB",
    description: "XFPCB manufactures server and data storage PCBs needing multilayer stackups, impedance control, BGA routing, HDI and high-reliability review.",
    keywords: ["server PCB", "data storage PCB", "high layer count PCB", "backplane PCB"],
    focus: "supporting dense hardware where high layer count, BGA routing, controlled impedance and thermal planning determine system stability",
    mustInclude: ["high layer count", "BGA and HDI", "impedance control", "thermal and connector review"],
    metrics: [["Applications", "Storage boards, compute modules, backplanes and network hardware"], ["Design concern", "Signal integrity and layer registration"], ["Related page", "High layer count PCB products up to 40 layers"]],
    image: imageMap.specialty
  },
  "/applications-and-industries-served/security-and-access-control-systems-pcbs/": {
    category: "industry",
    label: "Security System PCBs",
    h1: "PCBs for Security and Access Control Systems",
    title: "PCBs for Security and Access Control Systems | XFPCB",
    description: "XFPCB supports PCBs for security systems, access control, cameras, sensors, locks, readers and monitoring devices.",
    keywords: ["security system PCB", "access control PCB", "PCB for security devices", "camera PCB"],
    focus: "supporting connected security hardware where compact layout, connectors, power stability and repeatable assembly are important",
    mustInclude: ["camera and sensor modules", "access control boards", "connectors and relays", "prototype to production"],
    metrics: [["Applications", "Cameras, card readers, smart locks, alarms and access controllers"], ["Assembly concern", "Mixed SMT and through-hole connectors are common"], ["Buyer value", "One source for PCB, PCBA and enclosure-sensitive design review"]],
    image: imageMap.industry
  },
  "/applications-and-industries-served/pcbs-for-aerospace-and-defence/": {
    category: "industry",
    label: "Aerospace and Defense PCBs",
    h1: "PCBs for Aerospace and Defense-Style High-Reliability Electronics",
    title: "PCBs for Aerospace and Defense Electronics | XFPCB",
    description: "XFPCB supports high-reliability PCB discussions for aerospace and defense-style electronics where documentation, materials and inspection matter.",
    keywords: ["aerospace PCB", "defense PCB", "high reliability PCB", "PCB for aerospace electronics"],
    focus: "helping buyers discuss high-reliability board requirements, documentation, material selection and inspection before supplier approval",
    mustInclude: ["high-reliability review", "documentation control", "material traceability expectations", "inspection planning"],
    metrics: [["Applications", "Avionics-style modules, instruments, communication and control electronics"], ["Important note", "Compliance requirements must be stated before quotation"], ["Risk", "Assumptions about standards create supplier mismatch"]],
    image: imageMap.industry
  },
  "/applications-and-industries-served/pcbs-for-led-lighting/": {
    category: "industry",
    label: "LED Lighting PCBs",
    h1: "PCBs for LED Lighting with Thermal and Assembly Review",
    title: "PCBs for LED Lighting | LED PCB Manufacturing | XFPCB",
    description: "XFPCB manufactures PCBs for LED lighting applications, including aluminum PCB, metal core PCB, LED assembly and production support.",
    keywords: ["LED lighting PCB", "LED PCB manufacturing", "aluminum LED PCB", "PCB for LED lighting"],
    focus: "supporting LED lighting products where heat transfer, solderability, board finish and repeat production influence product life",
    mustInclude: ["aluminum PCB", "metal core PCB", "LED assembly", "thermal path review"],
    metrics: [["Applications", "Lamps, strips, modules, outdoor lighting and signage"], ["Risk", "Thermal design affects brightness and lifetime"], ["Related service", "LED PCB board manufacturing and LED PCB assembly"]],
    image: imageMap.thermal
  },
  "/how-to-place-an-order/": {
    category: "support",
    label: "Order Guide",
    h1: "How to Place a PCB or PCBA Order with XFPCB",
    title: "How to Place a PCB or PCBA Order | XFPCB",
    description: "Learn how to request a PCB or PCBA quote from XFPCB, what files to prepare and how the order moves from review to production.",
    keywords: ["PCB order guide", "how to order PCB", "PCBA quote", "PCB RFQ"],
    focus: "helping buyers prepare clear files and decisions so quotation, engineering review and production approval move smoothly",
    mustInclude: ["Gerber and drill files", "BOM and pick-and-place for PCBA", "quantity and lead time", "approval before production"],
    metrics: [["Bare PCB files", "Gerber, drill, stackup, material, copper, finish and quantity"], ["PCBA files", "BOM, CPL, assembly drawing and test requirements"], ["Fast quote", "Clear requirements reduce clarification rounds"]],
    image: imageMap.company
  },
  "/support/pcb-pcba-manufacturing-file/": {
    category: "support",
    label: "PCB and PCBA Manufacturing Files",
    h1: "PCB and PCBA Manufacturing Files Buyers Should Prepare",
    title: "PCB and PCBA Manufacturing Files | Gerber BOM CPL Guide | XFPCB",
    description: "Prepare the right PCB and PCBA manufacturing files for XFPCB, including Gerber, drill, stackup, BOM, pick-and-place and assembly notes.",
    keywords: ["PCB manufacturing files", "PCBA manufacturing files", "Gerber files", "BOM CPL assembly files"],
    focus: "explaining which files help XFPCB quote accurately and manufacture without avoidable engineering delays",
    mustInclude: ["Gerber files", "NC drill", "BOM with MPN", "pick-and-place and assembly drawing"],
    metrics: [["PCB", "Gerber, drill, board outline, stackup and finish requirements"], ["PCBA", "BOM, CPL, assembly drawing, DNP and test notes"], ["Risk", "Incomplete files cause wrong assumptions or delayed quotes"]],
    image: imageMap.materials
  },
  "/support/pcb-terminology-glossary/": {
    category: "support",
    label: "PCB Terminology Glossary",
    h1: "PCB Terminology Glossary for Buyers and Engineers",
    title: "PCB Terminology Glossary | PCB and PCBA Terms | XFPCB",
    description: "A practical PCB terminology glossary for buyers covering fabrication, assembly, materials, finishes, testing and RFQ communication.",
    keywords: ["PCB terminology", "PCB glossary", "PCBA terms", "PCB manufacturing terms"],
    focus: "making common PCB and PCBA terms easier to understand during quotation, engineering review and supplier communication",
    mustInclude: ["fabrication terms", "assembly terms", "material terms", "testing terms"],
    metrics: [["Who uses it", "Purchasing teams, engineers and project managers"], ["Purpose", "Reduce misunderstandings during RFQ"], ["Next step", "Send uncertain terms with your files for clarification"]],
    image: imageMap.company
  },
  "/pcb-materials/": {
    category: "support",
    label: "PCB Materials",
    h1: "PCB Materials Guide for FR-4, High Tg, RF, Flex and Metal Core Boards",
    title: "PCB Materials Guide | FR4 High Tg Rogers Flex Metal Core | XFPCB",
    description: "XFPCB helps buyers choose PCB materials for FR-4, High Tg, RF, flexible, rigid-flex, metal core and high-reliability board projects.",
    keywords: ["PCB materials", "FR4 PCB material", "High Tg PCB material", "Rogers PCB material", "metal core PCB"],
    focus: "choosing materials based on thermal, electrical, mechanical and cost requirements instead of using one default laminate for every project",
    mustInclude: ["FR-4 and high Tg", "RF materials", "polyimide flex", "aluminum and copper substrates"],
    metrics: [["Common materials", "FR-4, high Tg FR-4, Rogers-type RF laminates, polyimide and metal core substrates"], ["Selection driver", "Temperature, frequency, bend, current and cost"], ["Buyer action", "Share target material or performance requirement"]],
    image: imageMap.materials
  },
  "/pcb-board-testing-and-inspection/": {
    category: "testing",
    label: "Testing and Inspection",
    h1: "PCB and PCBA Testing and Inspection Methods",
    title: "PCB and PCBA Testing and Inspection | XFPCB Quality Control",
    description: "XFPCB supports PCB and PCBA testing and inspection including visual inspection, AOI, electrical test, flying probe and X-ray when required.",
    keywords: ["PCB testing", "PCB inspection", "PCBA testing", "PCB quality inspection"],
    focus: "matching inspection method to board complexity, component risk, order stage and buyer acceptance requirements",
    mustInclude: ["visual inspection", "AOI", "electrical testing", "flying probe and X-ray options"],
    metrics: [["PCB inspection", "CAM checks, in-process inspection and electrical test"], ["PCBA inspection", "AOI, visual inspection and X-ray for hidden joints"], ["Buyer action", "Define functional test or special acceptance requirements"]],
    image: imageMap.testing
  },
  "/pcb-board-testing-and-inspection/flying-probe-testing-for-pcb/": {
    category: "testing",
    label: "Flying Probe Testing",
    h1: "Flying Probe Testing for PCB Prototypes and Low-Volume Builds",
    title: "Flying Probe Testing for PCB | XFPCB",
    description: "XFPCB uses flying probe testing where fixture-free electrical test is useful for prototype, low-volume or complex PCB verification.",
    keywords: ["flying probe testing", "PCB flying probe test", "PCB electrical test", "prototype PCB testing"],
    focus: "checking opens and shorts without building a dedicated fixture, especially during prototype and low-volume PCB production",
    mustInclude: ["fixture-free test", "prototype testing", "opens and shorts", "netlist and Gerber review"],
    metrics: [["Best use", "Prototype and low-volume orders"], ["Benefit", "No dedicated fixture lead time"], ["Limitation", "Functional behavior still needs buyer-defined test if required"]],
    image: imageMap.testing
  },
  "/pcb-board-testing-and-inspection/x-ray-inspection-in-pcb-assembly/": {
    category: "testing",
    label: "X-Ray Inspection",
    h1: "X-Ray Inspection in PCB Assembly for Hidden Solder Joints",
    title: "X-Ray Inspection in PCB Assembly | BGA QFN PCBA Inspection | XFPCB",
    description: "XFPCB supports X-ray inspection for PCB assemblies with BGA, QFN, LGA and hidden solder joints that cannot be judged by visual inspection.",
    keywords: ["X-ray inspection PCB assembly", "BGA X-ray inspection", "PCBA X-ray", "PCB assembly inspection"],
    focus: "examining hidden solder joints and void risks for components that cannot be fully inspected by standard visual or AOI methods",
    mustInclude: ["BGA inspection", "QFN hidden joints", "void and bridge review", "PCBA quality control"],
    metrics: [["Best use", "BGA, QFN, LGA and bottom-terminated components"], ["What it helps find", "Bridges, opens, voids and alignment issues"], ["Buyer action", "Flag critical components in the assembly drawing"]],
    image: imageMap.quality
  }
};

function fallbackTopic(pagePath) {
  const clean = pagePath.replace(/^\/|\/$/g, "");
  const parts = clean.split("/");
  const last = parts.at(-1) || "pcb manufacturing";
  const label = last.split("-").map((part) => part.toUpperCase() === "PCB" ? "PCB" : part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  let category = "manufacturing";
  if (pagePath.includes("assembly")) category = "assembly";
  if (pagePath.includes("capabilit") || pagePath.includes("process")) category = "capability";
  if (pagePath.includes("applications")) category = "industry";
  if (pagePath.includes("manufacturer")) category = "company";
  if (pagePath.includes("stencil")) category = "stencil";
  if (pagePath.includes("testing") || pagePath.includes("inspection")) category = "testing";
  if (pagePath.includes("material") || pagePath.includes("support") || pagePath.includes("order")) category = "support";
  return {
    category,
    label,
    h1: `${label} by XFPCB`,
    title: `${label} | XFPCB PCB Manufacturing and Assembly`,
    description: `XFPCB supports ${label.toLowerCase()} with engineering review, practical manufacturing communication and global PCB or PCBA supply.`,
    keywords: [label, "XFPCB", "PCB manufacturing", "PCB assembly"],
    focus: `${label.toLowerCase()} projects that need clear engineering review and reliable production support`,
    mustInclude: ["file review", "engineering communication", "quality inspection", "quotation clarity"],
    metrics: [["Project scope", label], ["XFPCB role", "Engineering review, manufacturing and support"], ["Buyer action", "Send complete files and requirements"]],
    image: imageMap.manufacturing
  };
}

function topicFor(pagePath) {
  return topicOverrides[pagePath] || fallbackTopic(pagePath);
}

function categoryIntro(topic) {
  const map = {
    manufacturing: `XFPCB provides ${topic.label} for electronics teams that need reliable PCB fabrication, clear engineering communication and dependable delivery from prototype to production. Send your Gerber files, stackup notes and commercial requirements, and our team will confirm the manufacturing details before your order is released.`,
    prototype: `XFPCB supports ${topic.label} for fast samples used in electrical validation, enclosure checks, firmware debugging and customer approval. We review the file set, material choice, finish, quantity and target schedule so the first build is useful for the next revision or production lot.`,
    specialty: `XFPCB manufactures ${topic.label} for designs that need tighter process control than a standard FR-4 board. Our team checks stackup, via structure, material, solderability and inspection requirements so dense, high-speed or high-reliability boards can move into production smoothly.`,
    flex: `XFPCB builds ${topic.label} for products that need thin, bendable or integrated interconnects. We review the copper pattern, coverlay, stiffener, bend area and connector zone so the flexible circuit can fit the product mechanically and perform reliably in use.`,
    thermal: `XFPCB supplies ${topic.label} for LED, power, energy and high-current applications where heat transfer matters. We confirm substrate selection, dielectric construction, copper weight, solderability and inspection needs before production starts.`,
    assembly: `XFPCB provides ${topic.label} with PCB fabrication, component sourcing, SMT, through-hole assembly and inspection coordinated in one workflow. Your BOM, CPL, Gerber files and assembly notes are reviewed together so the build plan is clear before parts and boards move to the line.`,
    sourcing: `XFPCB helps source components for turnkey PCBA projects by checking BOM data, manufacturer part numbers, packages, stock status and approved alternates. This gives procurement teams a clear path from quotation to assembly release.`,
    stencil: `XFPCB supports ${topic.label} for SMT projects that need stable solder paste printing. We help confirm stencil thickness, aperture design, frame option and special areas for fine-pitch components or mixed paste-volume requirements.`,
    capability: `XFPCB supports ${topic.label} with file review, material confirmation, process planning and inspection options. We check submitted files, materials, component packages, inspection requirements and delivery expectations so the build can move forward with a clear production route.`,
    industry: `XFPCB supports ${topic.label} with PCB fabrication, PCBA, material selection and inspection planning matched to the product environment. Share the operating conditions and production goals, and our team will recommend a practical route for prototypes, pilot builds and repeat production.`,
    company: `XFPCB works with overseas electronics companies that need direct PCB manufacturing, PCBA support and practical communication from quotation to shipment. Our team helps clarify manufacturing details, file requirements, quality expectations and repeat-order documentation.`,
    quality: `XFPCB uses file review, process control and final inspection to support consistent PCB and PCBA quality. For ${topic.label}, we help define the inspection method, acceptance expectations and documentation needed before the order is built.`,
    support: `Use this XFPCB guide to prepare a complete PCB or PCBA request. Clear files, quantities, materials, finishes, assembly notes and test requirements help us quote faster and manufacture with fewer clarification rounds.`,
    testing: `XFPCB offers ${topic.label} support for PCB and PCBA projects that require verified electrical, visual or assembly quality. We can include electrical test, visual inspection, AOI, flying probe, X-ray or customer-defined test requirements during the RFQ stage.`
  };
  return map[topic.category] || map.manufacturing;
}

function procurementNote(topic) {
  const map = {
    manufacturing: `For a reliable quotation, include layer count, board size, material, copper weight, surface finish, solder mask color, quantity and delivery target. XFPCB will check the manufacturing data and confirm key details before tooling or panel planning begins.`,
    prototype: `For prototype orders, tell us the purpose of the build: electrical validation, connector fit, assembly trial, thermal behavior or customer samples. XFPCB can then recommend a practical schedule and production-ready specification.`,
    specialty: `For advanced boards, send the stackup, impedance targets, BGA pitch, via requirements, material preference and inspection notes. XFPCB will confirm which details affect yield, cost and lead time before production approval.`,
    flex: `For flex and rigid-flex projects, include the bend direction, bend radius, stiffener drawings, connector areas and whether the bend is static or dynamic. These details help XFPCB protect both electrical performance and mechanical reliability.`,
    thermal: `For thermal PCB projects, share heat source, current load, board thickness, substrate preference, dielectric requirements and assembly notes. XFPCB will help match the board construction to your thermal and cost targets.`,
    assembly: `For PCBA quotations, send Gerber files, BOM with manufacturer part numbers, pick-and-place data, assembly drawing, polarity notes, DNP list and test requirements. XFPCB can then align PCB fabrication, sourcing, assembly and inspection in one plan.`,
    sourcing: `For sourcing support, provide manufacturer part numbers, approved alternates, reference designators, quantity, target build date and any components you will supply yourself. XFPCB will confirm package, availability and substitution details before purchasing.`,
    stencil: `For stencil work, provide paste Gerber, panel data, component density and any fine-pitch or large thermal-pad areas. XFPCB will help choose stencil thickness and aperture strategy for stable paste printing.`,
    capability: `Include the files, materials, quantity, assembly scope and inspection requirements in your RFQ. Clear project data helps XFPCB confirm feasibility, pricing and production planning faster.`,
    industry: `Application details matter. Share the operating temperature, vibration, power load, service life, certification expectations and assembly environment so XFPCB can recommend PCB materials, finishes, inspection and PCBA options.`,
    company: `A good RFQ includes technical files and business expectations together. Send target quantity, lead time, shipping destination, quality requirements and future demand plans so XFPCB can support both first orders and repeat production.`,
    quality: `Quality requirements should be defined before production. Tell us whether you need electrical test, flying probe, AOI, X-ray, functional test support, special packaging or traceability documentation.`,
    support: `If your files are incomplete, send what you have and tell us what is still under design review. XFPCB will separate confirmed requirements from open items so your team can approve production details quickly.`,
    testing: `Inspection planning works best when critical nets, hidden solder joints, high-current areas, BGA/QFN components and functional test points are identified early. XFPCB will match the inspection method to the board and assembly requirements.`
  };
  return map[topic.category] || map.manufacturing;
}

function servicePosition(topic) {
  const map = {
    support: `After you send the required files and project details, XFPCB can check the RFQ, confirm the manufacturing route and prepare a clear quotation for your approval.`,
    company: `XFPCB combines factory communication, engineering review, manufacturing preparation, quality inspection and export support so your purchasing team can manage PCB and PCBA orders with one responsive supplier.`,
    capability: `XFPCB uses these capability checks to confirm whether the files, materials, geometry, assembly scope and inspection expectations match the planned production route.`,
    industry: `XFPCB connects application requirements with PCB fabrication, PCBA, material selection, inspection and packaging so the finished boards fit the way the product will be used.`,
    testing: `XFPCB helps choose practical inspection steps for the board type, assembly complexity and customer acceptance requirements before production is released.`
  };
  return map[topic.category] || `For ${topic.label}, XFPCB combines engineering review, manufacturing preparation, quality inspection and export communication so your purchasing team can move from RFQ to delivery with a clear build plan.`;
}

function risksFor(topic) {
  const base = {
    manufacturing: ["Stackup, board thickness, copper weight and surface finish are checked against the fabrication files.", "CAM review covers drill data, annular ring, trace spacing, solder mask and panelization.", "Material availability and production lead time are confirmed before order release.", "Electrical test and final inspection are planned according to the board type and quantity."],
    prototype: ["Gerber, drill, outline and stackup files are checked before the fast build starts.", "Material, copper, surface finish and solder mask choices are matched to the prototype purpose.", "Engineering questions are sent back early so the sample build can start cleanly.", "Prototype notes can be used for the next revision or production handoff."],
    specialty: ["Stackup, via structure, impedance targets and material choices are reviewed before production.", "Dense routing, BGA fanout and solder mask clearances are checked during CAM preparation.", "Inspection steps are selected for the board complexity and application requirements.", "Production notes are documented for repeat orders and future revisions."],
    flex: ["Bend radius, bend direction, coverlay openings and stiffener zones are checked from the drawing.", "Copper routing in bend areas is reviewed for mechanical reliability.", "Connector areas, adhesive, stiffener and assembly handling requirements are confirmed.", "Finished flexible circuits are inspected for outline, exposed pads and electrical continuity."],
    thermal: ["Thermal substrate, dielectric thickness and copper weight are matched to the heat load.", "LED, power device and high-current areas are reviewed before panel production.", "Solderability and surface finish are selected for the assembly method.", "Finished boards are checked for electrical continuity, appearance and dimensional requirements."],
    assembly: ["BOM, CPL, Gerber files and assembly drawings are reviewed together before the build.", "Component package, polarity, rotation and DNP information are checked before placement.", "Stencil, SMT, THT and mixed-technology sequence are prepared according to the board design.", "AOI, visual inspection, X-ray or functional test support can be added when required."],
    sourcing: ["Manufacturer part numbers, package codes and approved alternates are checked from the BOM.", "Stock status, lead time and substitution options are confirmed before purchasing.", "Customer-supplied parts and XFPCB-sourced parts are separated clearly in the build plan.", "Procurement timing is aligned with PCB fabrication and PCBA assembly release."],
    stencil: ["Paste Gerber, aperture areas, fiducials and panel data are checked before stencil production.", "Stencil thickness is selected according to component pitch and paste volume requirements.", "Step, nano-coating or electroform options are applied when the assembly needs tighter paste control.", "Stencil files and production notes are kept for repeat assembly orders."],
    capability: ["Files, materials, component packages and inspection requirements are checked against XFPCB capability.", "Layer count, copper, drill, surface finish and assembly scope are confirmed before quotation.", "Prototype, low-volume and production requirements are separated clearly in the build plan.", "Production notes support repeat orders, engineering changes and future sourcing."],
    industry: ["Material, finish, copper and assembly options are matched to the product environment.", "Thermal, vibration, power, signal and lifecycle requirements are reviewed before production.", "Prototype and pilot build requirements are separated from volume production needs.", "Inspection and packaging requirements are documented for shipment and repeat orders."],
    company: ["RFQ files, quantity, lead time and shipment destination are reviewed by the XFPCB team.", "Engineering questions are clarified before production data is released.", "PCB fabrication, PCBA, component sourcing and inspection can be coordinated together.", "Approved production data is kept organized for repeat orders and future revisions."],
    quality: ["CAM review, in-process inspection and final inspection are connected in one quality workflow.", "Electrical test, AOI, flying probe, X-ray and functional test support are selected by project need.", "Acceptance criteria, special packaging and documentation requirements are confirmed before shipment.", "Quality notes support future repeat orders and engineering changes."],
    support: ["Gerber, drill, stackup, BOM, CPL and assembly drawings are checked for completeness.", "Material, finish, copper, quantity and delivery requirements are confirmed during RFQ.", "Open engineering details are listed clearly for customer approval.", "Final quotation and production notes are aligned before manufacturing starts."],
    testing: ["Netlist, test points, critical nets and customer-defined checks are confirmed before testing.", "Flying probe, electrical test, AOI and X-ray are selected according to board and assembly needs.", "BGA, QFN, high-current and hidden solder-joint areas receive additional inspection planning.", "Inspection results and production notes can be kept for repeat orders."]
  };
  return base[topic.category] || base.manufacturing;
}

function workflowFor(topic) {
  const base = {
    manufacturing: ["Review Gerber, drill, stackup and drawing data.", "Confirm material, copper, surface finish and tolerances.", "Run CAM checks and clarify manufacturability questions.", "Build, inspect, electrically test and prepare shipment."],
    prototype: ["Check whether files are complete enough for a fast build.", "Confirm the fastest realistic material and finish options.", "Build samples with notes for production improvement.", "Review lessons before the next revision or volume order."],
    specialty: ["Review complex geometry and material requirements.", "Discuss stackup, via structure, impedance or thermal requirements.", "Confirm inspection method and acceptance expectations.", "Produce with controlled communication around any engineering details."],
    flex: ["Confirm bend direction, bend radius and static or dynamic use.", "Review coverlay, stiffener, adhesive and connector zones.", "Check panelization and assembly handling requirements.", "Manufacture and inspect with attention to mechanical stress areas."],
    thermal: ["Define heat source, current path and operating environment.", "Select substrate, dielectric and copper structure.", "Review solderability and assembly plan.", "Inspect finished boards for electrical and visual requirements."],
    assembly: ["Review PCB files, BOM, CPL and assembly drawing together.", "Check component availability, polarity, package and substitutes.", "Prepare stencil, SMT/THT sequence and inspection plan.", "Assemble, inspect and support shipment or functional test requirements."],
    sourcing: ["Clean the BOM and confirm manufacturer part numbers.", "Check package, lifecycle, stock and approved alternatives.", "Align procurement timing with PCB fabrication and assembly.", "Confirm purchasing details before parts are ordered."],
    stencil: ["Review paste layer, pad geometry and component mix.", "Choose stencil thickness, frame and special aperture strategy.", "Manufacture the stencil for prototype or production use.", "Use assembly feedback to tune future stencil revisions."],
    capability: ["Review design requirements and submitted production files.", "Confirm cost, lead-time and yield-sensitive features.", "Confirm inspection and documentation expectations.", "Release production after the approved build plan is clear."],
    industry: ["Understand the product environment and expected lifetime.", "Match PCB type, material, finish and assembly process to product demands.", "Prototype the critical features first.", "Move to repeat production with controlled documentation."],
    company: ["Receive files and commercial requirements.", "Review engineering requirements and production scope.", "Quote with visible scope and known exclusions.", "Support manufacturing, inspection, shipment and repeat orders."],
    quality: ["Start with file and requirement clarity.", "Apply in-process controls during fabrication or assembly.", "Choose inspection methods according to product requirements.", "Record quality notes for future orders."],
    support: ["Prepare files and requirement notes.", "Send RFQ details to XFPCB.", "Confirm engineering details before production.", "Approve the final manufacturing plan."],
    testing: ["Confirm the electrical and assembly checks required by the project.", "Choose electrical, optical, X-ray or functional checks as appropriate.", "Run inspection and record findings.", "Use the result to support future production files."]
  };
  return base[topic.category] || base.manufacturing;
}

function relatedLinks(topic, pagePath) {
  const pools = {
    manufacturing: [
      ["/prototype-pcb/", "PCB Prototype"],
      ["/pcb-manufacturing/quick-turn-pcb/", "Quick Turn PCB"],
      ["/pcb-manufacturing/hdi-pcb/", "HDI PCB"],
      ["/technical-capabilities/", "PCB Capabilities"],
      ["/pcb-assembly/", "PCB Assembly"]
    ],
    prototype: [
      ["/pcb-manufacturing/quick-turn-pcb/", "Quick Turn PCB"],
      ["/pcb-manufacturing/low-cost-pcbs-fabrication/", "Low Cost PCB"],
      ["/pcb-assembly/fast-prototype-pcb-assembly-service/", "Prototype PCB Assembly"],
      ["/how-to-place-an-order/", "Order Guide"],
      ["/support/pcb-pcba-manufacturing-file/", "Manufacturing Files"]
    ],
    specialty: [
      ["/pcb-manufacturing/hdi-pcb/", "HDI PCB"],
      ["/pcb-manufacturing/impedance-control-pcb/", "Impedance Control PCB"],
      ["/pcb-manufacturing/high-frequency-pcb/", "High Frequency PCB"],
      ["/technical-capabilities/hdi-pcb-board-fabrication-capabilities/", "HDI Capability"],
      ["/pcb-board-testing-and-inspection/", "Testing and Inspection"]
    ],
    flex: [
      ["/pcb-manufacturing/flexible-pcb/", "Flexible PCB"],
      ["/pcb-manufacturing/rigid-flex-pcb/", "Rigid-Flex PCB"],
      ["/technical-capabilities/flexible-pcb-fabrication-capability/", "Flexible PCB Capability"],
      ["/technical-capabilities/rigid-flex-pcb-fabrication-capability/", "Rigid-Flex Capability"],
      ["/pcb-assembly/", "PCB Assembly"]
    ],
    thermal: [
      ["/pcb-manufacturing/aluminum-pcbs/", "Aluminum PCB"],
      ["/pcb-manufacturing/copper-based-pcb/", "Copper Core PCB"],
      ["/pcb-manufacturing/heavy-copper-pcb/", "Heavy Copper PCB"],
      ["/pcb-manufacturing/led-pcb-board/", "LED PCB Board"],
      ["/applications-and-industries-served/pcbs-for-led-lighting/", "LED Lighting PCBs"]
    ],
    assembly: [
      ["/pcba-manufacturing/", "PCBA Manufacturing"],
      ["/pcb-assembly/smt-pcb-assembly/", "SMT PCB Assembly"],
      ["/pcb-assembly/full-turnkey-pcb-assembly-service/", "Turnkey PCB Assembly"],
      ["/pcb-assembly/components-purchasing-services/", "Component Sourcing"],
      ["/pcb-board-testing-and-inspection/x-ray-inspection-in-pcb-assembly/", "X-Ray Inspection"]
    ],
    sourcing: [
      ["/pcb-assembly/full-turnkey-pcb-assembly-service/", "Turnkey PCB Assembly"],
      ["/pcb-assembly/smt-pcb-assembly/", "SMT PCB Assembly"],
      ["/pcb-assembly/pcb-assembly-capability/", "PCB Assembly Capability"],
      ["/support/pcb-pcba-manufacturing-file/", "Manufacturing Files"],
      ["/how-to-place-an-order/", "Order Guide"]
    ],
    stencil: [
      ["/pcb-assembly/pcb-smt-stencil/", "PCB SMT Stencil"],
      ["/laser-cut-smt-stencil/", "Laser Cut SMT Stencil"],
      ["/step-stencil/", "Step Stencil"],
      ["/nano-coating-pcb-stencil-manufacturing/", "Nano-Coating Stencil"],
      ["/pcb-assembly/smt-pcb-assembly/", "SMT PCB Assembly"]
    ],
    capability: [
      ["/technical-capabilities/", "PCB Capabilities"],
      ["/pcb-fabrication-process/", "Fabrication Process"],
      ["/pcb-board-testing-and-inspection/", "Testing and Inspection"],
      ["/pcb-materials/", "PCB Materials"],
      ["/how-to-place-an-order/", "Order Guide"]
    ],
    industry: [
      ["/pcb-manufacturing/", "PCB Manufacturing"],
      ["/pcb-assembly/", "PCB Assembly"],
      ["/pcb-manufacturing/hdi-pcb/", "HDI PCB"],
      ["/pcb-manufacturing/metal-core-pcb/", "Metal Core PCB"],
      ["/technical-capabilities/", "Technical Capabilities"]
    ],
    company: [
      ["/about/", "About XFPCB"],
      ["/pcb-manufacturer/pcb-factory/", "PCB Factory"],
      ["/pcb-manufacturer/quality-management/", "Quality Management"],
      ["/technical-capabilities/", "Technical Capabilities"],
      ["/how-to-place-an-order/", "Order Guide"]
    ],
    quality: [
      ["/pcb-board-testing-and-inspection/", "Testing and Inspection"],
      ["/pcb-board-testing-and-inspection/flying-probe-testing-for-pcb/", "Flying Probe Testing"],
      ["/pcb-board-testing-and-inspection/x-ray-inspection-in-pcb-assembly/", "X-Ray Inspection"],
      ["/pcb-manufacturer/quality-management/", "Quality Management"],
      ["/support/pcb-pcba-manufacturing-file/", "Manufacturing Files"]
    ],
    support: [
      ["/how-to-place-an-order/", "Order Guide"],
      ["/support/pcb-pcba-manufacturing-file/", "Manufacturing Files"],
      ["/support/pcb-terminology-glossary/", "PCB Glossary"],
      ["/pcb-materials/", "PCB Materials"],
      ["/technical-capabilities/", "Technical Capabilities"]
    ],
    testing: [
      ["/pcb-board-testing-and-inspection/", "Testing and Inspection"],
      ["/pcb-board-testing-and-inspection/flying-probe-testing-for-pcb/", "Flying Probe Testing"],
      ["/pcb-board-testing-and-inspection/x-ray-inspection-in-pcb-assembly/", "X-Ray Inspection"],
      ["/pcb-assembly/pcb-assembly-capability/", "Assembly Capability"],
      ["/pcb-manufacturer/quality-management/", "Quality Management"]
    ]
  };
  return (pools[topic.category] || pools.manufacturing).filter(([href]) => href !== pagePath).slice(0, 4);
}

function researchSummary(research) {
  return "";
}

function workflowTitleFor(topic, index) {
  const titles = {
    manufacturing: ["File Review", "Specification Check", "CAM Preparation", "Manufacturing and Shipment"],
    prototype: ["File Readiness", "Fast-Build Options", "Sample Production", "Next Revision"],
    specialty: ["Advanced Review", "Stackup Planning", "Inspection Method", "Controlled Production"],
    flex: ["Bend Details", "Flex Construction", "Panel Handling", "Final Inspection"],
    thermal: ["Thermal Load", "Material Selection", "Assembly Plan", "Board Inspection"],
    assembly: ["File Review", "Parts Check", "Assembly Setup", "Inspection and Shipment"],
    sourcing: ["BOM Review", "Availability Check", "Procurement Timing", "Parts Approval"],
    stencil: ["Paste Layer Review", "Stencil Design", "Stencil Production", "Future Revisions"],
    capability: ["Requirement Review", "Capability Check", "Inspection Planning", "Production Release"],
    industry: ["Application Review", "Process Selection", "Prototype Stage", "Repeat Production"],
    company: ["RFQ Intake", "Scope Review", "Clear Quotation", "Ongoing Support"],
    quality: ["Requirement Clarity", "Process Control", "Inspection Choice", "Quality Records"],
    support: ["Prepare Files", "Send RFQ", "Confirm Details", "Approve Production"],
    testing: ["Test Requirements", "Inspection Method", "Run Checks", "Production Feedback"]
  };
  return (titles[topic.category] || titles.manufacturing)[index] || `Step ${index + 1}`;
}

function guideHeadingFor(topic) {
  if (topic.label === "Order Guide") return "How to Prepare a PCB or PCBA RFQ";
  if (topic.label.includes("Manufacturing Files")) return "PCB and PCBA Files to Prepare";
  if (topic.label.includes("Glossary")) return "Useful PCB and PCBA Terms";
  if (topic.label === "PCB Materials") return "How to Choose PCB Materials";
  return `How to Prepare for ${topic.label}`;
}

function quoteHeadingFor(topic) {
  if (topic.category === "support") return "Send Your PCB or PCBA RFQ to XFPCB";
  if (topic.category === "testing") return `Request Testing Support for ${topic.label}`;
  if (topic.category === "quality") return `Request Quality Review for ${topic.label}`;
  return `Request a Quote for ${topic.label}`;
}

function faqQuoteQuestionFor(topic) {
  if (topic.category === "support") return "What should I send for a PCB or PCBA RFQ?";
  if (topic.category === "testing") return `What files help XFPCB plan ${topic.label}?`;
  return `What should I send to quote ${topic.label}?`;
}

function cardItems(topic) {
  return topic.mustInclude.map((item, index) => {
    const descriptions = [
      `XFPCB reviews ${item} against your submitted files, quantity and application requirements before confirming the build plan.`,
      `Clear ${item} requirements help our team quote accurately, prepare production data and reduce avoidable clarification rounds.`,
      `Our engineers confirm details for ${item} early, so your team can approve the order with clear next steps.`,
      `Production notes for ${item} stay connected with the project to support repeat orders and future design revisions.`
    ];
    return { title: item, body: customerCopy(descriptions[index % descriptions.length]) };
  });
}

function faqFor(topic) {
  return [
    [faqQuoteQuestionFor(topic), `Send Gerber files, NC drill files, board outline, stackup notes, material, copper weight, surface finish, quantity and target lead time. For PCBA or assembly-related work, also send the BOM with manufacturer part numbers, pick-and-place data, assembly drawing, DNP notes and test expectations.`],
    [`Can XFPCB review the files before production?`, `Yes. XFPCB can review manufacturability and quotation details before production starts. We check material choices, via structures, component package data, tolerance requirements and inspection requirements before release.`],
    [`Can XFPCB support both prototype and production orders?`, `In most cases XFPCB can support both stages. Prototype builds help validate the design, while production planning controls repeatability, documentation, component supply and cost for future orders.`],
    [`How can I reduce quotation delays?`, `Provide complete files, expected annual or batch quantity, destination country, special standards, inspection needs and the target schedule. If the design is still changing, tell us which details are fixed and which are under review.`]
  ];
}

function glossaryBlock(topic) {
  const byCategory = {
    manufacturing: [["Stackup", "The order of copper, core and prepreg layers in a PCB."], ["Copper weight", "The copper thickness used for traces and planes."], ["Surface finish", "The final solderable coating on exposed pads."], ["Panelization", "How individual boards are arranged for manufacturing."]],
    prototype: [["DFM", "Design for manufacturability review before fabrication."], ["Revision", "The controlled design version used for production."], ["Lead time", "The time from file approval to shipment."], ["Pilot build", "A small production-like build before volume release."]],
    specialty: [["Microvia", "A small laser-drilled via used in HDI routing."], ["Controlled impedance", "A trace structure designed to meet a target impedance."], ["Via-in-pad", "A via placed in a component pad, often filled and capped."], ["Sequential lamination", "Multiple lamination cycles used for advanced via structures."]],
    flex: [["Coverlay", "A protective polyimide film used instead of standard solder mask."], ["Stiffener", "A reinforcement added under connectors or assembly areas."], ["Bend radius", "The minimum bend curve expected during use."], ["Static bend", "A flex area bent during installation but not repeatedly moved."]],
    thermal: [["Thermal dielectric", "The insulating layer that transfers heat to the metal substrate."], ["MCPCB", "Metal core printed circuit board."], ["Copper core", "A copper substrate used for high thermal conductivity."], ["Current path", "The copper route carrying significant electrical current."]],
    assembly: [["BOM", "Bill of materials listing every component."], ["CPL", "Component placement list showing coordinates and rotation."], ["AOI", "Automated optical inspection after assembly."], ["Reflow", "Heating process that solders SMT components."]],
    sourcing: [["MPN", "Manufacturer part number."], ["AVL", "Approved vendor list."], ["Substitution", "An alternate component used when approved."], ["Lifecycle", "Component status such as active, NRND or obsolete."]],
    stencil: [["Aperture", "The stencil opening that controls paste deposit."], ["Step-up", "A thicker stencil area for more paste."], ["Step-down", "A thinner area for fine-pitch parts."], ["Paste release", "How cleanly paste leaves the stencil opening."]],
    capability: [["Process window", "The manufacturable range for a design parameter."], ["Yield", "The percentage of boards passing required checks."], ["Tolerance", "Allowed dimensional or electrical variation."], ["Inspection plan", "The checks used to verify the product."]],
    industry: [["Operating environment", "Temperature, vibration, humidity and electrical conditions in use."], ["Lifecycle", "How long the product must be produced or supported."], ["Reliability target", "The expected field performance level."], ["NPI", "New product introduction from prototype to production."]],
    company: [["RFQ", "Request for quotation."], ["CAM", "Computer-aided manufacturing review of PCB files."], ["Turnkey", "Supplier manages PCB, parts and assembly."], ["Repeat order", "A later order using controlled approved files."]],
    quality: [["Traceability", "Ability to connect a shipment to files and production records."], ["Electrical test", "Test for opens and shorts on PCB nets."], ["X-ray", "Inspection method for hidden solder joints."], ["Acceptance criteria", "The agreed standard for pass or fail."]],
    support: [["Gerber", "Standard PCB fabrication artwork file."], ["NC drill", "Machine-readable drill file."], ["DNP", "Do not populate component note."], ["Stackup", "The PCB layer structure."]],
    testing: [["Flying probe", "Fixture-free electrical testing using moving probes."], ["Netlist", "Expected electrical connection data."], ["AOI", "Optical inspection for assembly or PCB defects."], ["Functional test", "A test that verifies product behavior, usually defined by the buyer."]]
  };
  return byCategory[topic.category] || byCategory.manufacturing;
}

function renderMetrics(metrics) {
  return `<div class="service-table-wrap"><table class="service-table"><thead><tr><th>Project Area</th><th>XFPCB Guidance</th></tr></thead><tbody>${metrics.map(([a, b]) => `<tr><td>${escapeHtml(customerCopy(a))}</td><td>${escapeHtml(customerCopy(b))}</td></tr>`).join("")}</tbody></table></div>`;
}

function renderInlineImage(topic, alt) {
  const second = topic.category === "assembly" ? imageMap.quality
    : topic.category === "industry" ? imageMap.manufacturing
    : topic.category === "thermal" ? imageMap.thermal
    : topic.category === "flex" ? imageMap.flex
    : topic.category === "testing" ? imageMap.quality
    : topic.category === "support" ? imageMap.materials
    : topic.image;
  return `<figure class="service-inline-image"><img src="${second}" alt="${escapeHtml(alt)}" loading="lazy"><figcaption>${escapeHtml(`${topic.label} production support at XFPCB includes file review, manufacturing preparation, inspection and shipment communication for global electronics customers.`)}</figcaption></figure>`;
}

function renderVariant(topic, pagePath, research) {
  const cards = cardItems(topic);
  const risks = risksFor(topic);
  const workflow = workflowFor(topic);
  const glossary = glossaryBlock(topic);
  const links = relatedLinks(topic, pagePath);
  const variant = {
    manufacturing: "matrix",
    prototype: "process",
    specialty: "deep",
    flex: "split",
    thermal: "matrix",
    assembly: "process",
    sourcing: "split",
    stencil: "process",
    capability: "matrix",
    industry: "split",
    company: "proof",
    quality: "deep",
    support: "guide",
    testing: "deep"
  }[topic.category] || "matrix";

  const intro = categoryIntro(topic);
  const procurement = procurementNote(topic);
  const position = servicePosition(topic);

  if (variant === "process") {
    return `
        <section class="service-section"><div class="service-wrap service-grid"><div><h2>XFPCB ${escapeHtml(topic.label)} Service</h2><p>${escapeHtml(intro)}</p><p>${escapeHtml(procurement)}</p><p>${escapeHtml(position)}</p></div><aside class="service-panel accent"><h3>RFQ Priorities</h3><ul class="service-list">${topic.mustInclude.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></aside></div></section>
        <section class="service-section dark"><div class="service-wrap"><h2>Order Workflow</h2><div class="service-process-grid">${workflow.map((step, index) => `<article class="service-step"><h3>${escapeHtml(workflowTitleFor(topic, index))}</h3><p>${escapeHtml(customerCopy(step))}</p></article>`).join("")}</div></div></section>
        <section class="service-section"><div class="service-wrap service-two-col"><div><h2>How XFPCB Controls the Build</h2><ul class="service-list">${risks.map((risk) => `<li>${escapeHtml(customerCopy(risk))}</li>`).join("")}</ul></div>${renderInlineImage(topic, `${topic.label} workflow at XFPCB`)}</div></section>
        <section class="service-section dark"><div class="service-wrap"><h2>Quotation Details</h2>${renderMetrics(topic.metrics)}<div class="service-card-grid">${cards.slice(0, 3).map((card) => `<article class="service-card"><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(customerCopy(card.body))}</p></article>`).join("")}</div></div></section>
        <section class="service-section"><div class="service-wrap service-two-col"><article class="service-panel"><h2>Useful Terms</h2><dl class="service-dl">${glossary.map(([term, definition]) => `<dt>${escapeHtml(term)}</dt><dd>${escapeHtml(definition)}</dd>`).join("")}</dl></article><article class="service-panel"><h2>Related XFPCB Pages</h2><ul class="service-list">${links.map(([href, text]) => `<li><a href="${href}">${escapeHtml(text)}</a></li>`).join("")}</ul></article></div></section>`;
  }

  if (variant === "split") {
    return `
        <section class="service-section"><div class="service-wrap service-two-col"><article><h2>Project Information for Quotation</h2><p>${escapeHtml(intro)}</p><p>${escapeHtml(procurement)}</p><ul class="service-list">${topic.mustInclude.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article>${renderInlineImage(topic, `${topic.label} application review`)}</div></section>
        <section class="service-section dark"><div class="service-wrap"><h2>Engineering and Procurement Details</h2><div class="service-feature-row">${cards.map((card) => `<article class="service-feature"><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.body)}</p></article>`).join("")}</div></div></section>
        <section class="service-section"><div class="service-wrap service-grid"><div><h2>How XFPCB Controls the Build</h2><p>${escapeHtml(customerCopy(position))}</p><ul class="service-list">${risks.map((risk) => `<li>${escapeHtml(customerCopy(risk))}</li>`).join("")}</ul></div><aside class="service-panel accent"><h3>Process Flow</h3><ol class="service-number-list">${workflow.map((step) => `<li>${escapeHtml(customerCopy(step))}</li>`).join("")}</ol></aside></div></section>
        <section class="service-section dark"><div class="service-wrap"><h2>Capability and Scope</h2>${renderMetrics(topic.metrics)}</div></section>
        <section class="service-section"><div class="service-wrap service-two-col"><article class="service-panel"><h2>Useful Terms</h2><dl class="service-dl">${glossary.map(([term, definition]) => `<dt>${escapeHtml(term)}</dt><dd>${escapeHtml(definition)}</dd>`).join("")}</dl></article><article class="service-panel"><h2>Related Services</h2><ul class="service-list">${links.map(([href, text]) => `<li><a href="${href}">${escapeHtml(text)}</a></li>`).join("")}</ul></article></div></section>`;
  }

  if (variant === "deep") {
    return `
        <section class="service-section"><div class="service-wrap"><h2>Technical Requirements for ${escapeHtml(topic.label)}</h2><p>${escapeHtml(intro)}</p><p>${escapeHtml(procurement)}</p><div class="service-callout">Send us the files, quantity, material preferences and inspection requirements that matter to your project. XFPCB will confirm what can be manufactured, what affects cost and what needs approval before production.</div></div></section>
        <section class="service-section dark"><div class="service-wrap service-grid"><div><h2>Engineering Checks</h2><div class="service-card-grid service-card-grid-2">${cards.map((card) => `<article class="service-card"><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(customerCopy(card.body))}</p></article>`).join("")}</div></div><aside class="service-panel accent"><h3>How XFPCB Controls the Build</h3><ul class="service-list">${risks.map((risk) => `<li>${escapeHtml(customerCopy(risk))}</li>`).join("")}</ul></aside></div></section>
        <section class="service-section"><div class="service-wrap service-two-col">${renderInlineImage(topic, `${topic.label} technical inspection`)}<article><h2>Production Workflow</h2><ol class="service-number-list">${workflow.map((step) => `<li>${escapeHtml(customerCopy(step))}</li>`).join("")}</ol><p>${escapeHtml(customerCopy(position))}</p></article></div></section>
        <section class="service-section dark"><div class="service-wrap"><h2>Specification Table</h2>${renderMetrics(topic.metrics)}</div></section>
        <section class="service-section"><div class="service-wrap service-two-col"><article class="service-panel"><h2>Key Terms</h2><dl class="service-dl">${glossary.map(([term, definition]) => `<dt>${escapeHtml(term)}</dt><dd>${escapeHtml(definition)}</dd>`).join("")}</dl></article><article class="service-panel"><h2>Related XFPCB Support</h2><ul class="service-list">${links.map(([href, text]) => `<li><a href="${href}">${escapeHtml(text)}</a></li>`).join("")}</ul></article></div></section>`;
  }

  if (variant === "proof") {
    return `
        <section class="service-section"><div class="service-wrap service-grid"><div><h2>How XFPCB Supports Your Project</h2><p>${escapeHtml(intro)}</p><p>${escapeHtml(procurement)}</p><p>Share not only Gerber files but also application context, sourcing expectations, inspection requirements and future production plans. XFPCB can then quote with a clearer technical and commercial scope.</p></div><aside class="service-panel accent"><h3>What We Confirm</h3><ul class="service-list">${topic.mustInclude.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></aside></div></section>
        <section class="service-section dark"><div class="service-wrap"><h2>What You Can Expect</h2><div class="service-proof-grid">${cards.map((card) => `<article class="service-proof"><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.body)}</p></article>`).join("")}</div></div></section>
        <section class="service-section"><div class="service-wrap service-two-col"><article><h2>How XFPCB Supports Your Project</h2><ul class="service-list">${risks.map((risk) => `<li>${escapeHtml(customerCopy(risk.replace(/\.$/, ".")))}</li>`).join("")}</ul></article>${renderInlineImage(topic, `${topic.label} customer support`)}</div></section>
        <section class="service-section dark"><div class="service-wrap"><h2>XFPCB Working Model</h2>${renderMetrics(topic.metrics)}</div></section>
        <section class="service-section"><div class="service-wrap service-two-col"><article class="service-panel"><h2>Useful Terms</h2><dl class="service-dl">${glossary.map(([term, definition]) => `<dt>${escapeHtml(term)}</dt><dd>${escapeHtml(definition)}</dd>`).join("")}</dl></article><article class="service-panel"><h2>Related XFPCB Pages</h2><ul class="service-list">${links.map(([href, text]) => `<li><a href="${href}">${escapeHtml(text)}</a></li>`).join("")}</ul></article></div></section>`;
  }

  if (variant === "guide") {
    return `
        <section class="service-section"><div class="service-wrap service-grid"><div><h2>${escapeHtml(guideHeadingFor(topic))}</h2><p>${escapeHtml(intro)}</p><p>${escapeHtml(procurement)}</p><p>${escapeHtml(position)}</p></div><aside class="service-panel accent"><h3>Prepare These Items</h3><ul class="service-list">${topic.mustInclude.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></aside></div></section>
        <section class="service-section dark"><div class="service-wrap"><h2>Step-by-Step RFQ Flow</h2><div class="service-process-grid">${workflow.map((step, index) => `<article class="service-step"><h3>${escapeHtml(workflowTitleFor(topic, index))}</h3><p>${escapeHtml(customerCopy(step))}</p></article>`).join("")}</div></div></section>
        <section class="service-section"><div class="service-wrap service-two-col">${renderInlineImage(topic, `${topic.label} document preparation`)}<article><h2>RFQ Details XFPCB Checks</h2><ul class="service-list">${risks.map((risk) => `<li>${escapeHtml(customerCopy(risk))}</li>`).join("")}</ul></article></div></section>
        <section class="service-section dark"><div class="service-wrap"><h2>RFQ Reference Table</h2>${renderMetrics(topic.metrics)}</div></section>
        <section class="service-section"><div class="service-wrap service-two-col"><article class="service-panel"><h2>Useful Definitions</h2><dl class="service-dl">${glossary.map(([term, definition]) => `<dt>${escapeHtml(term)}</dt><dd>${escapeHtml(definition)}</dd>`).join("")}</dl></article><article class="service-panel"><h2>Keep Reading</h2><ul class="service-list">${links.map(([href, text]) => `<li><a href="${href}">${escapeHtml(text)}</a></li>`).join("")}</ul></article></div></section>`;
  }

  return `
        <section class="service-section"><div class="service-wrap service-grid"><div><h2>XFPCB ${escapeHtml(topic.label)} Service</h2><p>${escapeHtml(intro)}</p><p>${escapeHtml(procurement)}</p><p>${escapeHtml(position)}</p></div><aside class="service-panel accent"><h3>What XFPCB Confirms</h3><ul class="service-list">${topic.mustInclude.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></aside></div></section>
        <section class="service-section dark"><div class="service-wrap"><h2>Key Service Items</h2><div class="service-card-grid">${cards.slice(0, 3).map((card) => `<article class="service-card"><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.body)}</p></article>`).join("")}</div></div></section>
        <section class="service-section"><div class="service-wrap service-two-col"><article><h2>How XFPCB Controls the Build</h2><ul class="service-list">${risks.map((risk) => `<li>${escapeHtml(customerCopy(risk))}</li>`).join("")}</ul></article>${renderInlineImage(topic, `${topic.label} manufacturing review`)}</div></section>
        <section class="service-section dark"><div class="service-wrap"><h2>Capability and RFQ Details</h2>${renderMetrics(topic.metrics)}</div></section>
        <section class="service-section"><div class="service-wrap service-two-col"><article class="service-panel"><h2>Process Flow</h2><ol class="service-number-list">${workflow.map((step) => `<li>${escapeHtml(customerCopy(step))}</li>`).join("")}</ol></article><article class="service-panel"><h2>Related XFPCB Pages</h2><ul class="service-list">${links.map(([href, text]) => `<li><a href="${href}">${escapeHtml(text)}</a></li>`).join("")}</ul></article></div></section>`;
}

function renderFaq(topic) {
  return `<section class="service-section dark"><div class="service-wrap"><h2>${escapeHtml(topic.label)} FAQs</h2><div class="service-faq-grid">${faqFor(topic).map(([q, a]) => `<details class="service-faq"><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join("")}</div></div></section>`;
}

function renderQuote(topic, pagePath) {
  return `<section class="service-section" id="quote"><div class="service-wrap service-quote-grid"><div><h2>${escapeHtml(quoteHeadingFor(topic))}</h2><p>Send your project information to XFPCB and our team will review the key manufacturing or assembly details. A complete RFQ helps us respond with a more accurate quote and a clearer production plan.</p><ul class="service-list"><li>For bare PCB projects, include Gerber, drill, stackup, material, copper, finish, quantity and lead time.</li><li>For PCBA projects, include BOM, pick-and-place file, assembly drawing, test notes and approved alternatives.</li><li>For application-specific projects, share operating environment, reliability expectations and packaging needs.</li></ul></div><form class="service-form" action="https://api.web3forms.com/submit" method="POST"><input type="hidden" name="access_key" value="${web3formsKey}"><input type="hidden" name="honeypot" style="display:none;"><input type="hidden" name="page_url" value="${xfpcbBase}${pagePath}"><input type="hidden" name="page_path" value="${pagePath}"><input type="hidden" name="page_title" value="${escapeHtml(topic.label)}"><input type="hidden" name="site_host" value="xfpcb.com"><input type="hidden" name="subject" value="${escapeHtml(topic.label)} Inquiry from XFPCB Website"><input type="hidden" name="redirect" value="${xfpcbBase}/"><label for="name">Name / Company *</label><input id="name" type="text" name="name" autocomplete="name" required><label for="email">Work Email *</label><input id="email" type="email" name="email" autocomplete="email" required><label for="message">Project Details *</label><textarea id="message" name="message" rows="6" placeholder="Quantity, layer count, material, board size, BOM status, assembly or testing requirements, target lead time..." required></textarea><button type="submit">Send Inquiry</button></form></div></section>`;
}

function renderStructuredData(topic, pagePath) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: topic.label,
    serviceType: topic.label,
    provider: {
      "@type": "Organization",
      name: "XingFeng PCB",
      url: `${xfpcbBase}/`
    },
    areaServed: "Worldwide",
    url: `${xfpcbBase}${pagePath}`,
    description: customerCopy(topic.description)
  };
  return JSON.stringify(data);
}

function kickerFor(topic) {
  const map = {
    manufacturing: "PCB fabrication",
    prototype: "Prototype PCB",
    specialty: "Advanced PCB",
    flex: "Flex and rigid-flex",
    thermal: "Thermal PCB",
    assembly: "PCB assembly",
    sourcing: "Component sourcing",
    stencil: "SMT stencil",
    capability: "Technical capability",
    industry: "Industry applications",
    company: "XFPCB company",
    quality: "Quality control",
    support: "RFQ support",
    testing: "Testing and inspection"
  };
  return map[topic.category] || "XFPCB service";
}

function renderPage(target, research, headerFallback, footerFallback) {
  const pagePath = target.path;
  const topic = topicFor(pagePath);
  const heroImage = topic.image || imageMap.manufacturing;
  const description = customerCopy(topic.description);
  const tags = [...topic.keywords.slice(0, 3), "DFM review", "prototype to production"].slice(0, 5);
  const body = renderVariant(topic, pagePath, research) + renderFaq(topic) + renderQuote(topic, pagePath);
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(topic.title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="keywords" content="${escapeHtml(topic.keywords.join(", "))}">
    <link rel="canonical" href="${xfpcbBase}${pagePath}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(topic.title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${xfpcbBase}${pagePath}">
    <meta property="og:image" content="${xfpcbBase}${heroImage}">
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="/css/about.css">
    <link rel="stylesheet" href="/css/service-pages.css">
    <link rel="icon" type="image/png" href="/images/xf-logo.png">
    <link rel="apple-touch-icon" href="/images/xf-logo.png">
    <script type="application/ld+json">${renderStructuredData(topic, pagePath)}</script>
</head>
<body>
    ${headerFallback}
    <main>
        <section class="service-hero service-hero-${escapeHtml(topic.category)}">
            <div class="service-wrap service-hero-grid">
                <div>
                    <div class="service-kicker">${escapeHtml(kickerFor(topic))}</div>
                    <h1>${escapeHtml(topic.h1)}</h1>
                    <p class="service-lead">${escapeHtml(description)}</p>
                    <div class="service-actions"><a class="service-primary" href="#quote">Request a Quote</a><a class="service-secondary" href="/support/">Ask Technical Support</a></div>
                    <div class="service-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
                </div>
                <figure class="service-visual"><img src="${heroImage}" alt="${escapeHtml(`${topic.label} at XFPCB`)}" loading="eager"><figcaption>${escapeHtml(`${topic.label} production support from XFPCB includes file review, manufacturing preparation, inspection and export communication for global electronics customers.`)}</figcaption></figure>
            </div>
        </section>
${body}
    </main>
    ${footerFallback}
    <floating-form></floating-form>
    <script type="module" src="/js/main.js"></script>
</body>
</html>
`;
}

async function updateSitemapXml() {
  const files = await walkIndexFiles(siteDir);
  const urls = files
    .filter((file) => !file.includes(`${path.sep}cdn-cgi${path.sep}`))
    .map((file) => pagePathFromFile(file))
    .sort((a, b) => a.localeCompare(b));
  const today = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${xfpcbBase}${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url === "/" ? "weekly" : "monthly"}</changefreq>
    <priority>${url === "/" ? "1.0" : url.split("/").length <= 3 ? "0.8" : "0.7"}</priority>
  </url>`).join("\n")}
</urlset>
`;
  await writeFile(path.join(siteDir, "sitemap.xml"), xml, "utf8");
}

async function updateHtmlSitemap() {
  const files = await walkIndexFiles(siteDir);
  const pages = [];
  for (const file of files) {
    if (file.includes(`${path.sep}cdn-cgi${path.sep}`)) continue;
    const pagePath = pagePathFromFile(file);
    const html = await readFile(file, "utf8");
    const title = htmlToText((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || pagePath);
    pages.push({ path: pagePath, title: title.replace(/\s*\|\s*XingFeng PCB.*$/i, "").replace(/\s*\|\s*XFPCB.*$/i, "") });
  }
  pages.sort((a, b) => a.path.localeCompare(b.path));
  const headerFallback = extractFallback(await readFile(path.join(siteDir, "pcb-manufacturing", "hdi-pcb", "index.html"), "utf8"), "app-header");
  const footerFallback = extractFallback(await readFile(path.join(siteDir, "pcb-manufacturing", "hdi-pcb", "index.html"), "utf8"), "app-footer");
  const sitemapPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Sitemap | XFPCB</title>
    <meta name="description" content="Browse the XFPCB HTML sitemap for PCB manufacturing, PCB assembly, technical capabilities, materials, inspection, industries and support pages.">
    <link rel="canonical" href="${xfpcbBase}/sitemap/">
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="/css/about.css">
    <link rel="stylesheet" href="/css/service-pages.css">
    <link rel="icon" type="image/png" href="/images/xf-logo.png">
</head>
<body>
    ${headerFallback}
    <main>
        <section class="service-hero"><div class="service-wrap"><div class="service-kicker">XFPCB sitemap</div><h1>HTML Sitemap</h1><p class="service-lead">Find XFPCB pages for PCB fabrication, PCBA, technical capabilities, inspection, materials, industry applications and support.</p></div></section>
        <section class="service-section"><div class="service-wrap"><div class="service-sitemap-grid">${pages.map((page) => `<a href="${page.path}">${escapeHtml(page.title || page.path)}</a>`).join("")}</div></div></section>
    </main>
    ${footerFallback}
    <floating-form></floating-form>
    <script type="module" src="/js/main.js"></script>
</body>
</html>
`;
  await writeFile(path.join(siteDir, "sitemap", "index.html"), sitemapPage, "utf8");
}

async function validateGenerated() {
  const files = await walkIndexFiles(siteDir);
  const duplicateTitles = new Map();
  const problems = [];
  for (const file of files) {
    const html = await readFile(file, "utf8");
    const pagePath = pagePathFromFile(file);
    if (/pcbelec|jhypcb/i.test(html)) problems.push(`${pagePath}: competitor brand/domain found in final HTML`);
    if (/href=["'][^"']*\.html/i.test(html)) problems.push(`${pagePath}: .html href found`);
    if (/src=["'](?!\/|https?:|data:)/i.test(html)) problems.push(`${pagePath}: relative src found`);
    const title = htmlToText((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
    if (title) {
      if (!duplicateTitles.has(title)) duplicateTitles.set(title, []);
      duplicateTitles.get(title).push(pagePath);
    }
  }
  for (const [title, paths] of duplicateTitles) {
    if (paths.length > 1) problems.push(`Duplicate title "${title}" on ${paths.join(", ")}`);
  }
  return problems;
}

async function main() {
  const targets = await findGeneratedTargets();
  if (!targets.length) {
    console.log(JSON.stringify({ generated: 0, message: "No generated pages with the old marker were found." }, null, 2));
    return;
  }
  const headerFallback = extractFallback(targets[0].oldHtml, "app-header");
  const footerFallback = extractFallback(targets[0].oldHtml, "app-footer");
  const researchMap = await fetchResearchForTargets(targets);
  for (const target of targets) {
    const research = researchMap.get(target.path) || {};
    await writeFile(target.file, renderPage(target, research, headerFallback, footerFallback), "utf8");
  }
  await updateSitemapXml();
  await updateHtmlSitemap();
  const problems = await validateGenerated();
  const summary = {
    generated: targets.length,
    researchDir,
    samplePages: targets.slice(0, 8).map((target) => target.path),
    validationProblems: problems
  };
  await writeFile(path.join(researchDir, "rewrite-summary.json"), JSON.stringify(summary, null, 2), "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
