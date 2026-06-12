const fs = require("fs");
const path = require("path");

const root = "C:\\Users\\Administrator\\Documents\\XFPCB";
const siteRoot = path.join(root, "site");
const contentRoot = path.join(root, "hugo-src", "content");

const web3AccessKey = "40f0bc17-2a5a-45e0-85cf-99aa9d8b06df";
const heroImage = "/images/675x542pcb.jpg";
const ogImage = "https://xfpcb.com/images/675x542pcb.jpg";

const headerFallback = `<app-header>
    <div class="seo-links" style="display:none;">
        <a href="/">Home</a>
        <a href="/about/">About Us</a>
        <a href="/products/">Products</a>
        <a href="/products/1-layer-pcb/">1-Layer PCB</a>
        <a href="/products/2-layer-pcb/">2-Layer PCB</a>
        <a href="/products/4-layer-pcb/">4-Layer PCB</a>
        <a href="/products/6-layer-pcb/">6-Layer PCB</a>
        <a href="/products/8-layer-pcb/">8-Layer PCB</a>
        <a href="/products/10-layer-pcb/">10-Layer PCB</a>
        <a href="/products/12-layer-pcb/">12-Layer PCB</a>
        <a href="/products/14-layer-pcb/">14-Layer PCB</a>
        <a href="/products/16-layer-pcb/">16-Layer PCB</a>
        <a href="/products/20-layer-pcb/">20-Layer PCB</a>
        <a href="/products/24-layer-pcb/">24-Layer PCB</a>
        <a href="/products/32-layer-pcb/">32-Layer PCB</a>
        <a href="/products/40-layer-pcb/">40-Layer PCB</a>
        <a href="/products/multilayer-pcb/">Multilayer PCB Guide</a>
        <a href="/products/high-layer-count-pcb/">High Layer Count Facility</a>
        <a href="/pcb-assembly/">PCB Assembly</a>
        <a href="/support/">Request a Quote</a>
    </div>
</app-header>`;

const footerFallback = `<app-footer>
    <div class="seo-links" style="display:none;">
        <a href="/privacy/">Privacy Policy</a>
        <a href="/terms/">Terms of Service</a>
        <a href="/support/">Technical Support</a>
        <a href="/sitemap/">Sitemap</a>
        <a href="/products/">PCB Products</a>
        <a href="/pcb-assembly/">PCBA Manufacturing</a>
    </div>
</app-footer>`;

function yamlString(value) {
  return `'${String(value || "").replace(/'/g, "''")}'`;
}

function list(items) {
  return `<ul class="layer-check-list">
${items.map((item) => `                    <li>${item}</li>`).join("\n")}
                </ul>`;
}

function table(headers, rows) {
  return `<div class="layer-table-wrap">
                    <table class="layer-spec-table">
                        <thead>
                            <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
                        </thead>
                        <tbody>
${rows.map((row) => `                            <tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("\n")}
                        </tbody>
                    </table>
                </div>`;
}

function cards(items) {
  return `<div class="layer-card-grid">
${items.map((item) => `                    <article class="layer-card">
                        <span>${item.kicker}</span>
                        <h3>${item.title}</h3>
                        <p>${item.text}</p>
                    </article>`).join("\n")}
                </div>`;
}

function stackup(layers) {
  return `<div class="stackup-container layer-stackup">
                    <div class="stackup-diagram">
${layers.map((layer) => `                        <div class="stackup-layer ${layer.type}">
                            <span>${layer.name}</span>
                            <span class="layer-desc">${layer.desc}</span>
                        </div>`).join("\n")}
                    </div>
                </div>`;
}

function quoteForm(page) {
  const pageUrl = `https://xfpcb.com/products/${page.slug}/`;
  return `<section class="layer-rfq-section" id="quote">
            <div class="container layer-rfq-grid">
                <div class="layer-rfq-copy">
                    <p class="eyebrow">Send RFQ to XFPCB</p>
                    <h2>Get a practical quotation for ${page.shortName}</h2>
                    <p>${page.rfqIntro}</p>
                    ${list(page.rfqItems)}
                    <p class="layer-rfq-note">For a faster engineering reply, include Gerber files, drill files, PCB specification, quantity, delivery country and any impedance, material or assembly requirements.</p>
                </div>
                <form class="layer-rfq-form" action="https://api.web3forms.com/submit" method="POST">
                    <input type="hidden" name="access_key" value="${web3AccessKey}">
                    <input type="hidden" name="honeypot" style="display:none;">
                    <input type="hidden" name="page_url" value="${pageUrl}">
                    <input type="hidden" name="page_path" value="/products/${page.slug}/">
                    <input type="hidden" name="subject" value="${page.shortName} RFQ from XFPCB product page">
                    <input type="hidden" name="redirect" value="https://xfpcb.com/">
                    <label>
                        Name
                        <input type="text" name="name" placeholder="Your name" required>
                    </label>
                    <label>
                        Email
                        <input type="email" name="email" placeholder="name@company.com" required>
                    </label>
                    <label>
                        Project Requirements
                        <textarea name="message" placeholder="${page.formPlaceholder}" required></textarea>
                    </label>
                    <button type="submit">Send ${page.layerLabel} PCB Inquiry</button>
                </form>
            </div>
        </section>`;
}

function relatedLinks(currentSlug) {
  const links = [
    ["1-layer-pcb", "1-Layer PCB"],
    ["2-layer-pcb", "2-Layer PCB"],
    ["4-layer-pcb", "4-Layer PCB"],
    ["6-layer-pcb", "6-Layer PCB"],
    ["8-layer-pcb", "8-Layer PCB"],
    ["multilayer-pcb", "Multilayer PCB Guide"],
    ["high-layer-count-pcb", "High Layer Count PCB"]
  ];
  return `<section class="bg-darker">
            <div class="container">
                <div class="layer-section-heading">
                    <p class="eyebrow">Related PCB products</p>
                    <h2>Compare layer counts before you send your RFQ</h2>
                    <p>Many buyers begin with one layer count and change after DFM review, enclosure checks or cost comparison. These XFPCB pages help you select the most suitable PCB structure before production.</p>
                </div>
                <div class="related-layer-links">
${links.map(([slug, label]) => {
  const active = slug === currentSlug ? " active" : "";
  return `                    <a class="related-layer-link${active}" href="/products/${slug}/">${label}</a>`;
}).join("\n")}
                </div>
            </div>
        </section>`;
}

const pages = [
  {
    slug: "1-layer-pcb",
    layerLabel: "1-Layer",
    shortName: "1-Layer PCB",
    title: "1 Layer PCB Manufacturer | Single Sided PCB Factory for Cost-Controlled Production | XFPCB",
    description: "XFPCB manufactures 1 layer PCB and single sided PCB boards for LED, power, control and cost-sensitive production with DFM review and export support.",
    keywords: "1 layer PCB manufacturer, single sided PCB manufacturer, single layer PCB, FR4 single sided PCB, aluminum PCB, LED PCB manufacturer, China PCB factory",
    h1: "1 Layer PCB Manufacturer for Cost-Controlled Single Sided Boards",
    h2: "Direct China PCB factory support for LED, power, control and high-volume simple circuits",
    intro: "A 1 layer PCB is selected when the circuit is simple, the target price is strict, and the purchasing team needs a stable board that can be repeated thousands or millions of times without unnecessary process cost. XFPCB supports overseas buyers with single sided PCB fabrication, CAM review, material selection, panelization advice and export shipment planning from prototype validation to production release.",
    heroAlt: "XFPCB single sided 1 layer PCB manufacturing for export buyers",
    pills: ["Single sided PCB", "FR-4 / CEM-1 / CEM-3", "Aluminum PCB option", "Cost-focused production"],
    insightTitle: "What international buyers usually need from a 1 layer PCB supplier",
    insightIntro: "Most 1 layer PCB buyers start with a cost target, but the successful order depends on more than a low unit price. The factory must understand material choice, tooling route, solderability, panel efficiency and repeat production stability before the board can move smoothly into assembly.",
    cards: [
      { kicker: "Cost control", title: "Panel efficiency before price promises", text: "XFPCB reviews outline, V-cut, routing, copper balance and tooling direction so the quote reflects the real manufacturing route instead of a rough board-area calculation." },
      { kicker: "Material choice", title: "Use the laminate that fits the job", text: "FR-4 is common for general electronics, CEM-1 or CEM-3 can reduce cost for suitable high-volume designs, and aluminum base material helps LED and power boards move heat away from components." },
      { kicker: "Assembly yield", title: "Solderability matters on simple boards", text: "A single sided PCB still needs clean solder mask registration, reliable pad finish, readable markings and consistent board flatness for manual, wave or selective soldering." },
      { kicker: "Export buying", title: "Clear specs reduce RFQ back-and-forth", text: "Procurement teams can compare suppliers faster when the RFQ includes material, copper weight, finish, board outline, tolerance, packaging and delivery expectations." }
    ],
    specIntro: "For 1 layer PCB projects, the most important decisions are often material, surface finish, copper weight and mechanical processing. XFPCB confirms each point against your Gerber files and end-use requirements before production.",
    table: {
      headers: ["Buying item", "XFPCB recommendation", "Why it matters"],
      rows: [
        ["General consumer boards", "FR-4 single sided PCB with HASL, lead-free HASL or OSP", "A practical balance between price, solderability and availability for power adapters, controls and simple electronics."],
        ["High-volume cost-sensitive boards", "CEM-1 or CEM-3 when the design and application allow it", "Can support lower material cost and efficient punching routes for repeat orders after tooling confirmation."],
        ["LED and thermal boards", "Aluminum base PCB with suitable dielectric thermal conductivity", "Helps move heat from LEDs or power components to the metal base and enclosure."],
        ["Power and high-current traces", "Wider copper, correct creepage and copper weight review", "Reduces voltage-drop, thermal and safety risk before the board moves to mass production."],
        ["Stable assembly supply", "Finish selection based on assembly date and storage plan", "OSP is cost effective for fast assembly; HASL or ENIG may be selected when shelf life or pad flatness requirements differ."]
      ]
    },
    sections: [
      {
        eyebrow: "DFM review",
        title: "Single sided does not mean no engineering review",
        text: [
          "Many sourcing teams treat 1 layer PCB manufacturing as a commodity, but small design choices can change cost and production stability. XFPCB checks annular clearance around holes, solder mask opening, copper-to-edge distance, trace width, copper balance, panel tooling holes and routing direction. For LED boards, we also look at thermal pad geometry and whether the aluminum substrate specification matches the heat path required by the product.",
          "When the board is intended for high quantity, our team can discuss whether CNC routing, V-scoring, punching or combined processing is the better route. This helps the buyer understand not just the prototype price, but also the cost of repeat production."
        ]
      },
      {
        eyebrow: "Quality control",
        title: "How XFPCB protects simple PCB orders from avoidable defects",
        text: [
          "The production plan includes CAM file checking, incoming material confirmation, solder mask and legend inspection, dimensional control and electrical testing when required by the order. For single sided boards used in power, appliance and lighting products, we pay attention to solderability, board flatness, copper adhesion and packing protection because these details directly affect assembly yield.",
          "For overseas procurement, XFPCB can package boards by lot, part number and purchase order requirement, making incoming inspection easier for your warehouse or assembly partner."
        ]
      }
    ],
    process: [
      ["1. Send Gerber and target quantity", "Include material preference, finish, board thickness, copper weight and delivery country."],
      ["2. CAM and cost review", "XFPCB checks whether the design can be produced efficiently and flags details that may affect cost or lead time."],
      ["3. Prototype or sample confirmation", "For new projects, a short validation run helps confirm fit, solderability and mechanical requirements."],
      ["4. Repeat production and shipment", "After approval, the same data package can be used for stable repeat orders and export delivery."]
    ],
    faq: [
      ["Is a 1 layer PCB always the cheapest option?", "Usually it is the lowest-cost structure, but the final price still depends on material, copper weight, finish, board size, panel utilization, outline process, quantity and inspection requirements."],
      ["Can XFPCB make aluminum 1 layer PCBs for LED lighting?", "Yes. XFPCB can review aluminum PCB requirements for LED and power applications, including dielectric thermal performance, copper weight, surface finish and mechanical outline."],
      ["What should I send for an accurate single sided PCB quote?", "Send Gerber files, drill files, material and thickness, copper weight, surface finish, solder mask color, silkscreen, quantity, delivery country and any assembly or packaging requirement."]
    ],
    rfqIntro: "A useful 1 layer PCB quote needs more than board size. The more complete your manufacturing details are, the faster XFPCB can recommend the right material and production route.",
    rfqItems: ["Gerber and drill files", "Material preference: FR-4, CEM-1, CEM-3 or aluminum", "Copper weight, board thickness and surface finish", "Target quantity, annual forecast and delivery country"],
    formPlaceholder: "Example: 1 layer FR-4 PCB, 1.6 mm, 1 oz copper, green solder mask, lead-free HASL, 5,000 pcs, ship to Germany.",
    applications: ["LED tubes, downlights and lighting drivers", "Power adapters and charger boards", "Simple appliance controls and relay boards", "Basic sensor, alarm and display modules"]
  },
  {
    slug: "2-layer-pcb",
    layerLabel: "2-Layer",
    shortName: "2-Layer PCB",
    title: "2 Layer PCB Manufacturer | Double Sided PCB Fabrication and Prototype-to-Production | XFPCB",
    description: "XFPCB provides 2 layer PCB and double sided PCB manufacturing for prototypes, small batches and production orders with PTH, DFM review and export delivery.",
    keywords: "2 layer PCB manufacturer, double sided PCB manufacturer, PTH PCB, PCB prototype, quick turn PCB, double sided PCB fabrication, China PCB factory",
    h1: "2 Layer PCB Manufacturer for Reliable Double Sided Fabrication",
    h2: "Prototype-to-production support for buyers who need PTH vias, stable solderability and clear communication",
    intro: "A 2 layer PCB is the workhorse for many electronics projects: enough routing room for components on both sides, plated through holes for connection between layers, and a cost level that still fits prototype, low-volume and mid-volume production. XFPCB helps overseas buyers move from first Gerber review to repeat orders with clear engineering feedback, practical material options and dependable fabrication control.",
    heroAlt: "XFPCB 2 layer double sided PCB fabrication for overseas procurement",
    pills: ["Double sided PCB", "PTH vias", "Prototype to production", "Assembly-ready options"],
    insightTitle: "What buyers compare when searching for a 2 layer PCB manufacturer",
    insightIntro: "Most 2 layer PCB buyers need a supplier that can move quickly without treating the order as a blind upload. Procurement teams usually ask a deeper question: will this factory catch design risks before production and deliver double sided boards that are ready for assembly?",
    cards: [
      { kicker: "Routing freedom", title: "Two copper layers with plated through vias", text: "Double sided PCBs allow signals and power to move between top and bottom copper layers, making them suitable for controllers, sensor boards, small IoT devices and many industrial modules." },
      { kicker: "Procurement fit", title: "Good for samples, bridge orders and repeat builds", text: "XFPCB can support early prototypes and then help stabilize the same part number for repeat production when the design becomes commercial." },
      { kicker: "Engineering check", title: "PTH quality starts with the drill file", text: "We review drill size, annular ring, slot definition, via tenting, copper clearance and panelization before releasing the order." },
      { kicker: "Assembly readiness", title: "Finish, mask and markings selected for your process", text: "Lead-free HASL, ENIG and OSP can be discussed according to soldering method, shelf-life requirement, pad flatness and cost target." }
    ],
    specIntro: "For most 2 layer PCB projects, the RFQ should define the baseline board structure clearly. XFPCB confirms the manufacturing data before quoting so buyers can compare price, lead time and risk with more confidence.",
    table: {
      headers: ["Specification", "Common XFPCB options", "Procurement note"],
      rows: [
        ["Base material", "FR-4 is the standard; high Tg can be considered when temperature or reliability demands increase", "Material selection should match the product environment, not only the lowest prototype price."],
        ["Copper weight", "Commonly 1 oz, with heavier copper reviewed by trace current and fabrication limits", "High-current designs need wider traces, thermal relief review and clear copper notes."],
        ["Surface finish", "Lead-free HASL, ENIG, OSP and other finishes by project requirement", "ENIG helps pad flatness for fine pitch parts; HASL is often cost efficient for through-hole and standard SMT."],
        ["Mechanical details", "Routed outline, V-score, slots, cutouts and panel rails", "Incorrect slot or outline data is a common reason for delayed quotes and tooling questions."],
        ["Testing", "Electrical test and visual inspection based on order requirement", "A clear testing requirement helps protect assembly yield and incoming quality approval."]
      ]
    },
    sections: [
      {
        eyebrow: "Manufacturing review",
        title: "What XFPCB checks before a 2 layer PCB order is released",
        text: [
          "A double sided PCB usually looks straightforward, but many first-time and repeat-order issues begin in small details: drill-to-pad clearance, plated slot definition, solder mask slivers, silkscreen over pads, insufficient copper relief, or a panel design that is difficult to depanel cleanly. XFPCB reviews these points so the buyer can correct risk before fabrication rather than after boards arrive.",
          "For procurement teams working with engineers in another time zone, our goal is to make the RFQ conversation practical. We identify missing files, confirm stackup basics, and ask for only the details needed to quote and build the board correctly."
        ]
      },
      {
        eyebrow: "Buyer conversion",
        title: "Built for buyers who need more than a prototype price",
        text: [
          "A very low sample price is not helpful if the production order later changes material, finish, panel layout or test method. XFPCB looks at the path from prototype to production from the beginning, especially when your 2 layer PCB will be assembled, shipped to another supplier, or used in a regulated product category.",
          "We can quote a small validation lot and a production lot in the same conversation, helping you compare cost, lead time and technical risk before you place the first purchase order."
        ]
      }
    ],
    process: [
      ["1. File intake", "Gerber, drill, BOM if assembly is needed, quantity and delivery destination are reviewed for quote completeness."],
      ["2. DFM questions", "XFPCB flags missing dimensions, unclear slots, tight clearances or finish choices that may affect fabrication."],
      ["3. Fabrication and testing", "The order moves through imaging, drilling, plating, solder mask, finish, routing and inspection according to confirmed specs."],
      ["4. Export packing", "Boards are packed by lot and project requirement so incoming inspection and assembly handoff are easier."]
    ],
    faq: [
      ["What is the difference between a 1 layer and 2 layer PCB?", "A 2 layer PCB has copper on both sides and uses plated through holes or vias to connect the layers. This gives designers more routing options and usually supports more complex circuits."],
      ["Can XFPCB quote both prototype and production quantities?", "Yes. Send both quantities if you want to compare prototype, pilot run and repeat-order pricing. That helps us review panelization and cost more realistically."],
      ["Do I need ENIG for every 2 layer PCB?", "No. ENIG is useful for fine pitch pads, flatness and certain shelf-life requirements, but lead-free HASL or OSP may be more cost-effective for many standard boards."]
    ],
    rfqIntro: "For double sided PCB fabrication, complete files help XFPCB quote faster and avoid questions after the order starts.",
    rfqItems: ["Gerber, drill and board outline files", "Quantity for prototype and production comparison", "Board thickness, copper weight and surface finish", "Any assembly, panelization or electrical test requirement"],
    formPlaceholder: "Example: 2 layer FR-4 PCB, 1.6 mm, 1 oz copper, ENIG, 200 prototypes and 3,000 production pcs, electrical test required.",
    applications: ["IoT sensors and gateways", "Industrial control interface boards", "Power supply control circuits", "Educational, startup and validation prototypes"]
  },
  {
    slug: "4-layer-pcb",
    layerLabel: "4-Layer",
    shortName: "4-Layer PCB",
    title: "4 Layer PCB Manufacturer | Multilayer PCB Stackup and Impedance Support | XFPCB",
    description: "XFPCB manufactures 4 layer PCB boards with multilayer stackup review, ground and power planes, impedance discussion and production support for global buyers.",
    keywords: "4 layer PCB manufacturer, 4 layer PCB stackup, multilayer PCB, impedance control PCB, IoT PCB, smart device PCB, China PCB manufacturer",
    h1: "4 Layer PCB Manufacturer for Compact Multilayer Electronics",
    h2: "A practical upgrade when your 2 layer PCB needs cleaner routing, better EMI control and stable power distribution",
    intro: "A 4 layer PCB is often the first serious multilayer step for IoT products, smart devices, wireless modules, compact controllers and commercial electronics. With two outer routing layers and inner reference or power planes, the board can reduce noise, simplify routing and improve assembly density without moving immediately to a high-cost advanced stackup. XFPCB helps buyers confirm the stackup, material, impedance needs and inspection plan before fabrication.",
    heroAlt: "XFPCB 4 layer PCB stackup and multilayer manufacturing",
    pills: ["4 layer stackup", "Ground and power planes", "Impedance discussion", "IoT and smart devices"],
    insightTitle: "Why buyers search beyond a basic 4 layer PCB price",
    insightIntro: "For 4 layer PCB buyers, the key is not simply adding two layers. The real decision is whether the stackup will support the layout, certification goals, signal paths and production cost of the final product without creating avoidable manufacturing risk.",
    cards: [
      { kicker: "Stackup planning", title: "Confirm layer purpose before fabrication", text: "A common 4 layer approach uses top signal, inner ground, inner power and bottom signal, but XFPCB confirms the structure against your routing and impedance needs." },
      { kicker: "EMI control", title: "Reference planes improve return paths", text: "Solid internal planes can reduce loop area, support cleaner signals and make EMC preparation easier for products moving toward market release." },
      { kicker: "Cost balance", title: "More capability without jumping too high", text: "A 4 layer PCB often provides the best cost-to-performance step for buyers upgrading from 2 layer boards." },
      { kicker: "Procurement clarity", title: "Specs should be locked before layout release", text: "Board thickness, dielectric target, copper weight and finish should be discussed early because they affect trace width and impedance." }
    ],
    stackup: [
      { type: "layer-cu", name: "L1: Top Copper", desc: "Signal and component layer" },
      { type: "layer-prepreg", name: "Prepreg", desc: "Dielectric spacing confirmed by stackup" },
      { type: "layer-cu", name: "L2: Ground Plane", desc: "Reference plane for signals" },
      { type: "layer-core", name: "FR-4 Core", desc: "Mechanical support and dielectric thickness" },
      { type: "layer-cu", name: "L3: Power Plane", desc: "Power distribution or split plane" },
      { type: "layer-prepreg", name: "Prepreg", desc: "Balanced construction" },
      { type: "layer-cu", name: "L4: Bottom Copper", desc: "Signal and secondary component layer" }
    ],
    specIntro: "The exact stackup must be confirmed before production. The example below shows the buying decisions that usually matter most for a 4 layer PCB quote.",
    table: {
      headers: ["Decision", "Typical requirement", "XFPCB review focus"],
      rows: [
        ["Stackup", "Signal / GND / Power / Signal or project-specific alternative", "Plane continuity, copper balance, drill structure and manufacturability."],
        ["Impedance", "50 ohm single-ended, 90 or 100 ohm differential when required", "Material, dielectric thickness, copper thickness and trace width must be aligned with the design."],
        ["Material", "Standard FR-4 or high Tg FR-4 depending on reliability needs", "Temperature exposure, reflow profile, assembly plan and long-term product use."],
        ["Surface finish", "HASL, ENIG, OSP or project-specific finish", "Pad flatness, BGA/fine pitch needs, assembly date and cost target."],
        ["Testing", "Electrical test and visual inspection; impedance coupons when required", "Define special test needs in RFQ so cost and lead time are clear."]
      ]
    },
    sections: [
      {
        eyebrow: "Engineering fit",
        title: "When a 4 layer PCB is the right choice",
        text: [
          "A product usually moves to 4 layers when routing on a 2 layer PCB becomes crowded, when a wireless or high-speed interface needs a more stable return path, or when power distribution and ground isolation are becoming difficult. The extra internal planes can improve layout discipline and make the final product easier to debug.",
          "XFPCB works with buyers who need the board manufactured reliably, but also need the quote to make sense commercially. We can review whether your design truly needs 4 layers, or whether the same goal can be met by adjusting the 2 layer design or moving to 6 layers for a denser product."
        ]
      },
      {
        eyebrow: "DFM and quality",
        title: "Multilayer reliability begins before lamination",
        text: [
          "For 4 layer PCBs, our CAM review pays attention to layer registration, drill-to-inner clearance, plane openings, resin flow risk, copper balance and solder mask definition. These details affect not only fabrication yield, but also assembly yield and field reliability.",
          "If your board includes USB, Ethernet, RF, WiFi, LVDS or other impedance-sensitive traces, send the target impedance and stackup preference early. XFPCB can discuss practical manufacturing options before your layout is frozen."
        ]
      }
    ],
    process: [
      ["1. Stackup confirmation", "Confirm layer purpose, board thickness, material, copper weight and any impedance targets."],
      ["2. CAM and DFM check", "Review inner clearance, drill rules, plane openings, solder mask and mechanical outline."],
      ["3. Lamination and fabrication", "Proceed through inner layer imaging, lamination, drilling, plating, outer layer imaging, solder mask, finish and routing."],
      ["4. Inspection and delivery", "Electrical test and visual inspection are matched to the order, then boards are packed for export shipment."]
    ],
    faq: [
      ["Is a 4 layer PCB better than a 2 layer PCB?", "It is better when the design needs cleaner routing, lower noise, more stable power distribution or controlled impedance. For very simple circuits, 2 layers may still be more economical."],
      ["Can XFPCB help with 4 layer PCB stackup selection?", "Yes. Send your target board thickness, copper weight, impedance requirements and application. XFPCB can review practical stackup options for fabrication."],
      ["Should I define impedance before layout?", "Yes. If controlled impedance matters, define the target before layout is complete so trace width and dielectric spacing can be matched to a manufacturable stackup."]
    ],
    rfqIntro: "A 4 layer PCB quote should include enough engineering detail for stackup and impedance review. This prevents redesign after pricing.",
    rfqItems: ["Gerber, drill and stackup request", "Board thickness, copper weight and material", "Impedance targets if any", "Quantity, lead time target and delivery country"],
    formPlaceholder: "Example: 4 layer PCB, 1.6 mm FR-4, 1 oz outer copper, ENIG, 50 ohm single-ended impedance needed, 1,000 pcs.",
    applications: ["IoT gateways and smart home devices", "Wireless modules and compact controllers", "Industrial interface boards", "USB, Ethernet and low-to-mid speed digital products"]
  },
  {
    slug: "6-layer-pcb",
    layerLabel: "6-Layer",
    shortName: "6-Layer PCB",
    title: "6 Layer PCB Manufacturer | Industrial Multilayer PCB with Impedance Control | XFPCB",
    description: "XFPCB manufactures 6 layer PCB boards for industrial, automotive-style and dense electronics with stackup review, DFM support and quality control.",
    keywords: "6 layer PCB manufacturer, 6 layer PCB stackup, impedance control PCB, industrial PCB, automotive PCB, multilayer PCB manufacturer, China PCB factory",
    h1: "6 Layer PCB Manufacturer for Dense Industrial Electronics",
    h2: "Better routing density, multiple power domains and controlled signal paths for demanding PCB projects",
    intro: "A 6 layer PCB is chosen when a 4 layer board no longer gives enough routing space, isolation or power-plane flexibility. It is common in industrial controllers, measurement devices, automotive-style electronics, communication modules and compact products using fine-pitch components. XFPCB supports overseas buyers with stackup discussion, DFM review, multilayer fabrication control and practical export quotation support.",
    heroAlt: "XFPCB 6 layer multilayer PCB manufacturing for industrial electronics",
    pills: ["6 layer stackup", "Industrial electronics", "Controlled impedance", "BGA routing support"],
    insightTitle: "What serious buyers want from a 6 layer PCB factory",
    insightIntro: "For 6 layer PCB procurement teams, the pain point is usually supplier confidence: can the factory understand the stackup, prevent inner-layer defects and communicate clearly when a design is close to the process window? XFPCB writes each quote around that practical manufacturing conversation.",
    cards: [
      { kicker: "Density", title: "More internal routing and plane options", text: "Six layers give engineers room for high-pin-count components, multiple power rails and cleaner separation between noisy and sensitive circuits." },
      { kicker: "Reliability", title: "Inner-layer quality must be controlled", text: "XFPCB reviews registration, drill-to-inner clearance, lamination balance and copper distribution so fabrication risk is visible before production." },
      { kicker: "Impedance", title: "Useful for high-speed and measurement products", text: "Controlled impedance can be discussed for USB, Ethernet, differential pairs, clock routes and other signals that need consistent geometry." },
      { kicker: "Production planning", title: "Prototype decisions should not block mass production", text: "Material, finish, stackup and test choices are reviewed with both sample and repeat production in mind." }
    ],
    stackup: [
      { type: "layer-cu", name: "L1: Top Signal", desc: "Components, fanout and microstrip routing" },
      { type: "layer-prepreg", name: "Prepreg", desc: "Controlled dielectric spacing" },
      { type: "layer-cu", name: "L2: Ground Plane", desc: "Reference plane and EMI control" },
      { type: "layer-core", name: "Core", desc: "Lamination structure" },
      { type: "layer-cu", name: "L3: Inner Signal", desc: "Stripline routing when required" },
      { type: "layer-prepreg", name: "Prepreg", desc: "Center dielectric" },
      { type: "layer-cu", name: "L4: Inner Signal / Power", desc: "Signal or split power by design" },
      { type: "layer-core", name: "Core", desc: "Balanced build" },
      { type: "layer-cu", name: "L5: Power or Ground", desc: "Power domains or additional reference" },
      { type: "layer-prepreg", name: "Prepreg", desc: "Outer dielectric spacing" },
      { type: "layer-cu", name: "L6: Bottom Signal", desc: "Secondary components and routing" }
    ],
    specIntro: "A 6 layer PCB quote should not be treated as a simple board-area calculation. The stackup, copper distribution and testing plan directly affect lead time, yield and long-term product reliability.",
    table: {
      headers: ["Procurement topic", "What to define", "Why XFPCB asks"],
      rows: [
        ["Layer purpose", "Signal, GND, power and split-plane use by layer", "Prevents ambiguous CAM decisions and supports better signal return paths."],
        ["Board material", "FR-4 grade, high Tg requirement or special laminate", "Industrial and automotive-style products may need stronger thermal and reliability margins."],
        ["Impedance", "Target values and tolerance where needed", "Trace geometry depends on dielectric thickness, copper weight and stackup."],
        ["Drill structure", "PTH, slots, via size and BGA fanout requirements", "Fine-pitch designs may require tighter review before price and lead time are confirmed."],
        ["Inspection", "Electrical test, AOI and any impedance coupon requirement", "Testing expectations should be included early so the quotation is complete."]
      ]
    },
    sections: [
      {
        eyebrow: "Application fit",
        title: "When buyers should choose 6 layers instead of 4",
        text: [
          "A 6 layer board becomes attractive when the design has multiple power domains, dense connectors, fine-pitch ICs, mixed analog and digital circuits, or controlled-impedance routing that needs better reference planes. The additional layers can reduce compromises that would otherwise make the board harder to test or certify.",
          "XFPCB can help you compare the manufacturing impact of 4, 6 and 8 layer structures. This is useful when the buyer wants the lowest practical cost but cannot sacrifice product reliability."
        ]
      },
      {
        eyebrow: "Manufacturing control",
        title: "How XFPCB reviews multilayer risk before production",
        text: [
          "For 6 layer PCB orders, our CAM review focuses on inner-layer clearance, drill registration, plane relief, resin fill risk, copper balance, thermal relief, solder mask clearance and panel stability. These details are not glamorous, but they determine whether the order runs smoothly.",
          "When impedance or high-speed performance matters, the buyer should provide the target impedance, signal layer, reference layer and tolerance. XFPCB can then align the quote with a stackup that is realistic for fabrication rather than a theoretical drawing that is difficult to build."
        ]
      }
    ],
    process: [
      ["1. Engineering RFQ", "Send Gerber, stackup, drawing, target quantity, impedance needs and material notes."],
      ["2. Risk review", "XFPCB checks the design against multilayer rules and asks practical questions before order release."],
      ["3. Controlled fabrication", "Inner layers, lamination, drilling, plating, solder mask, finish and profiling follow the confirmed build notes."],
      ["4. Quality release", "Testing and inspection records are matched to the order before export packaging."]
    ],
    faq: [
      ["What products commonly use a 6 layer PCB?", "Industrial control boards, measurement devices, communication modules, automotive-style electronics, dense IoT products and boards using fine-pitch ICs often benefit from 6 layers."],
      ["Does every 6 layer PCB need controlled impedance?", "No. Controlled impedance is needed when signal performance requires it. If your design has USB, Ethernet, RF, differential pairs or strict timing, include impedance details in the RFQ."],
      ["Can XFPCB help compare 6 layer and 8 layer options?", "Yes. If routing density or signal integrity is uncertain, send the project requirements and we can discuss whether 6 or 8 layers is more practical for cost and manufacturability."]
    ],
    rfqIntro: "For 6 layer PCB projects, procurement success depends on clear stackup, material and test information. XFPCB can review the files and respond with practical questions quickly.",
    rfqItems: ["Gerber, drill, drawing and stackup", "Material grade, Tg requirement and board thickness", "Impedance targets and tolerance if required", "Prototype and production quantities"],
    formPlaceholder: "Example: 6 layer industrial PCB, high Tg FR-4, 1.6 mm, ENIG, controlled impedance on L1/L6, 500 pcs first order.",
    applications: ["Industrial control and automation boards", "Measurement and medical-style electronic modules", "Automotive-style control electronics", "Dense communication and gateway boards"]
  },
  {
    slug: "8-layer-pcb",
    layerLabel: "8-Layer",
    shortName: "8-Layer PCB",
    title: "8 Layer PCB Manufacturer | HDI, High Speed and Controlled Impedance PCB | XFPCB",
    description: "XFPCB manufactures 8 layer PCB boards for high-speed, HDI, telecom, RF and dense electronics with stackup planning, DFM review and export support.",
    keywords: "8 layer PCB manufacturer, 8 layer PCB stackup, HDI PCB, high speed PCB, controlled impedance PCB, blind buried vias, signal integrity PCB, China PCB factory",
    h1: "8 Layer PCB Manufacturer for High-Speed and HDI Projects",
    h2: "Stackup planning, impedance discussion and dense multilayer fabrication for demanding overseas buyers",
    intro: "An 8 layer PCB is selected when routing density, signal integrity, power integrity and component pitch make a lower layer count risky. It is common in telecom hardware, networking equipment, RF modules, high-speed digital products, dense BGA designs and advanced industrial electronics. XFPCB helps procurement and engineering teams turn complex board data into a manufacturable PCB quotation with clear DFM feedback.",
    heroAlt: "XFPCB 8 layer high speed HDI PCB manufacturing",
    pills: ["8 layer stackup", "High-speed PCB", "HDI options", "Controlled impedance"],
    insightTitle: "What buyers expect when searching for an 8 layer PCB manufacturer",
    insightIntro: "For 8 layer PCB buyers, the real concern is whether the supplier can discuss HDI needs, high-speed routing, material loss, drill structure, controlled impedance and inspection in a way that reduces the risk of a complex order.",
    cards: [
      { kicker: "Signal integrity", title: "More reference planes for high-speed routes", text: "Eight layers make it easier to place critical signals near solid reference planes and reduce crosstalk in compact layouts." },
      { kicker: "HDI planning", title: "Blind, buried and via-in-pad options by project", text: "Dense BGA escape routing can require advanced via structures. XFPCB reviews these options against cost, yield and lead time before quoting." },
      { kicker: "Material strategy", title: "FR-4, high Tg and low-loss laminates discussed early", text: "At higher frequencies, material choice affects loss and consistency. The RFQ should include speed, frequency and impedance requirements when they matter." },
      { kicker: "Procurement risk", title: "Complex boards need exact communication", text: "The quote should reflect stackup, drill plan, finish, testing and special acceptance requirements, not only board area." }
    ],
    stackup: [
      { type: "layer-cu", name: "L1: Top Signal", desc: "Critical components and high-speed fanout" },
      { type: "layer-prepreg", name: "Prepreg", desc: "Dielectric for microstrip control" },
      { type: "layer-cu", name: "L2: Ground Plane", desc: "Primary reference plane" },
      { type: "layer-core", name: "Core", desc: "Lamination structure" },
      { type: "layer-cu", name: "L3: Signal", desc: "Stripline routing" },
      { type: "layer-prepreg", name: "Prepreg", desc: "Controlled spacing" },
      { type: "layer-cu", name: "L4: Power Plane", desc: "Power distribution" },
      { type: "layer-core", name: "Core", desc: "Balanced center" },
      { type: "layer-cu", name: "L5: Ground / Power", desc: "Reference or power by design" },
      { type: "layer-prepreg", name: "Prepreg", desc: "Controlled spacing" },
      { type: "layer-cu", name: "L6: Signal", desc: "Stripline routing" },
      { type: "layer-core", name: "Core", desc: "Lamination structure" },
      { type: "layer-cu", name: "L7: Ground Plane", desc: "Secondary reference plane" },
      { type: "layer-prepreg", name: "Prepreg", desc: "Outer dielectric" },
      { type: "layer-cu", name: "L8: Bottom Signal", desc: "Components, routing and test access" }
    ],
    specIntro: "For an 8 layer PCB, the manufacturing conversation should start with stackup, via structure and material choice. XFPCB reviews these points so the buyer can understand tradeoffs before approving cost and lead time.",
    table: {
      headers: ["Complexity driver", "Common buyer requirement", "XFPCB review focus"],
      rows: [
        ["High-speed routing", "PCIe, Ethernet, USB, DDR, LVDS or other controlled routes", "Impedance target, reference plane continuity, trace layer and material behavior."],
        ["HDI structure", "Blind vias, buried vias, microvias or via-in-pad where needed", "Sequential lamination, drill feasibility, plating reliability, cost and yield impact."],
        ["RF or low-loss need", "Low Dk/Df material, hybrid stackup or special laminate", "Availability, stackup compatibility, price and lead time."],
        ["BGA escape", "Fine pitch packages and dense component placement", "Via size, pad design, solder mask, finish and test access."],
        ["Inspection plan", "Electrical test, AOI, X-ray or impedance coupon when required", "Define requirements at RFQ stage so acceptance criteria are clear."]
      ]
    },
    sections: [
      {
        eyebrow: "High-speed buying",
        title: "An 8 layer PCB quote must connect engineering and purchasing",
        text: [
          "A procurement team may ask for the lowest price, while the design team needs controlled impedance, stable power planes, fine-pitch reliability and low signal loss. XFPCB helps connect those requirements by reviewing the manufacturing data and asking for missing technical details before the quote is locked.",
          "This matters because a small change in via structure, material, copper weight or impedance tolerance can change the cost and lead time significantly. A clear conversation early protects both engineering schedule and purchasing budget."
        ]
      },
      {
        eyebrow: "Manufacturability",
        title: "HDI and advanced via decisions should be justified",
        text: [
          "Blind vias, buried vias and via-in-pad can solve routing problems, but they are not free features. They add process steps and must be matched to the real need of the layout. XFPCB reviews whether standard through vias are enough, or whether an HDI structure is justified by BGA pitch, board size, layer density or signal requirements.",
          "For high-speed and RF boards, XFPCB can discuss stackup, material and impedance requirements before fabrication. If the design requires special acceptance criteria, include them in the RFQ so the quotation is aligned with the final inspection plan."
        ]
      }
    ],
    process: [
      ["1. Technical RFQ", "Provide Gerber, drill, stackup, impedance table, material preference and special notes."],
      ["2. Stackup and via review", "XFPCB checks whether the build structure is practical for fabrication, cost and lead time."],
      ["3. Controlled manufacturing", "Complex inner layers, lamination, drilling, plating, surface finish and profiling follow confirmed instructions."],
      ["4. Final verification", "Inspection and electrical test are handled according to the accepted order requirements before export packing."]
    ],
    faq: [
      ["When should I choose an 8 layer PCB?", "Choose 8 layers when routing density, signal integrity, power integrity or fine-pitch components make 4 or 6 layers risky or inefficient."],
      ["Does XFPCB support HDI structures for 8 layer boards?", "XFPCB can review HDI needs such as blind vias, buried vias and via-in-pad by project. The final process depends on files, stackup, quantity, lead time and acceptance requirements."],
      ["What information is needed for a high-speed 8 layer PCB quote?", "Send stackup, impedance targets, material preference, copper weight, via structure, Gerber and drill files, test needs, quantity and delivery country."]
    ],
    rfqIntro: "For 8 layer PCB projects, XFPCB needs enough technical detail to review stackup and via decisions before price and lead time are confirmed.",
    rfqItems: ["Gerber, drill and complete stackup", "Impedance table and signal layer notes", "HDI or via-in-pad requirement if any", "Material preference, quantity and delivery schedule"],
    formPlaceholder: "Example: 8 layer high-speed PCB, ENIG, 100 ohm differential pairs, blind vias under BGA, 200 prototypes and 1,000 production pcs.",
    applications: ["Telecom and networking hardware", "RF and wireless communication modules", "Dense BGA and FPGA boards", "High-speed industrial and embedded systems"]
  }
];

function renderPage(page) {
  const canonical = `https://xfpcb.com/products/${page.slug}/`;
  const stackupHtml = page.stackup ? `<section class="container layer-content-section">
                <div class="layer-section-heading">
                    <p class="eyebrow">Stackup planning</p>
                    <h2>Example ${page.shortName} stackup discussion</h2>
                    <p>This is a practical starting point, not a locked universal stackup. XFPCB confirms dielectric spacing, copper weight, material and impedance targets against your real files before fabrication.</p>
                </div>
                ${stackup(page.stackup)}
            </section>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.title}</title>
    <meta name="description" content="${page.description}">
    <meta name="keywords" content="${page.keywords}">
    <link rel="canonical" href="${canonical}">
    <meta property="og:title" content="${page.title}">
    <meta property="og:description" content="${page.description}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:type" content="website">
    <link rel="stylesheet" href="/css/style.css?v=20260602-layer-pages">
    <link rel="stylesheet" href="/css/about.css?v=20260602-layer-pages">
    <link rel="stylesheet" href="/css/products.css?v=20260602-layer-pages">
    <link rel="icon" type="image/png" href="/images/xf-logo.png">
    <link rel="apple-touch-icon" href="/images/xf-logo.png">
</head>
<body>
    ${headerFallback}

    <main class="layer-service-page">
        <section class="product-hero layer-hero">
            <div class="container product-hero-grid">
                <div class="product-text">
                    <p class="eyebrow">XFPCB China PCB Manufacturer</p>
                    <h1>${page.h1}</h1>
                    <h2>${page.h2}</h2>
                    <p class="desc">${page.intro}</p>
                    <div class="layer-hero-pills">
${page.pills.map((pill) => `                        <span>${pill}</span>`).join("\n")}
                    </div>
                    <div class="layer-hero-actions">
                        <a href="#quote" class="cta-btn">Request ${page.layerLabel} PCB Quote</a>
                        <a href="/products/" class="layer-secondary-btn">View PCB Products</a>
                    </div>
                </div>
                <div class="product-visual">
                    <div class="product-image-wrapper layer-image-frame">
                        <img src="${heroImage}" alt="${page.heroAlt}">
                    </div>
                    <div class="layer-visual-note">
                        <strong>Buyer focus:</strong> DFM review, stable fabrication, export communication and repeat-order support.
                    </div>
                </div>
            </div>
        </section>

        <section class="bg-darker layer-intent-section">
            <div class="container">
                <div class="layer-section-heading">
                    <p class="eyebrow">Procurement intent</p>
                    <h2>${page.insightTitle}</h2>
                    <p>${page.insightIntro}</p>
                </div>
                ${cards(page.cards)}
            </div>
        </section>

        <section class="container layer-content-section">
            <div class="layer-section-heading">
                <p class="eyebrow">Manufacturing specification</p>
                <h2>${page.shortName} buying guide and RFQ details</h2>
                <p>${page.specIntro}</p>
            </div>
            ${table(page.table.headers, page.table.rows)}
        </section>

        ${stackupHtml}

        <section class="bg-darker layer-content-section">
            <div class="container layer-two-column">
${page.sections.map((section) => `                <article class="layer-text-panel">
                    <p class="eyebrow">${section.eyebrow}</p>
                    <h2>${section.title}</h2>
${section.text.map((paragraph) => `                    <p>${paragraph}</p>`).join("\n")}
                </article>`).join("\n")}
            </div>
        </section>

        <section class="container layer-content-section">
            <div class="layer-section-heading">
                <p class="eyebrow">Order workflow</p>
                <h2>How XFPCB moves your ${page.shortName} project from files to shipment</h2>
                <p>Procurement teams need predictable communication. The steps below show how XFPCB turns design files into a manufacturing plan that can be quoted, produced and shipped with fewer surprises.</p>
            </div>
            <div class="layer-process-grid">
${page.process.map(([title, text]) => `                <article class="layer-process-step">
                    <h3>${title}</h3>
                    <p>${text}</p>
                </article>`).join("\n")}
            </div>
        </section>

        <section class="bg-darker layer-content-section">
            <div class="container">
                <div class="layer-section-heading">
                    <p class="eyebrow">Applications</p>
                    <h2>Where buyers commonly use ${page.shortName}</h2>
                    <p>XFPCB writes each quote around the real product environment, not a generic layer-count label. Tell us where the board will be used so material, finish and testing choices can match the risk level.</p>
                </div>
                <div class="layer-application-grid">
${page.applications.map((item) => `                    <div class="layer-application-item">${item}</div>`).join("\n")}
                </div>
            </div>
        </section>

        <section class="container layer-content-section">
            <div class="layer-section-heading">
                <p class="eyebrow">FAQ</p>
                <h2>${page.shortName} questions buyers ask before placing an order</h2>
            </div>
            <div class="layer-faq-list">
${page.faq.map(([question, answer]) => `                <article class="faq-item">
                    <h4>${question}</h4>
                    <p>${answer}</p>
                </article>`).join("\n")}
            </div>
        </section>

        ${quoteForm(page)}

        ${relatedLinks(page.slug)}
    </main>

    ${footerFallback}
    <floating-form></floating-form>
    <script type="module" src="/js/main.js?v=20260602-layer-pages"></script>
    <script defer src="https://static.cloudflareinsights.com/beacon.min.js/v833ccba57c9e4d2798f2e76cebdd09a11778172276447" integrity="sha512-57MDmcccJXYtNnH+ZiBwzC4jb2rvgVCEokYN+L/nLlmO8rfYT/gIpW2A569iJ/3b+0UEasghjuZH/ma3wIs/EQ==" data-cf-beacon='{"version":"2024.11.0","token":"d1d027d07f4d422e808a4feb1adccb99","r":1,"server_timing":{"name":{"cfCacheStatus":true,"cfEdge":true,"cfExtPri":true,"cfL4":true,"cfOrigin":true,"cfSpeedBrain":true},"location_startswith":null}}' crossorigin="anonymous"></script>
</body>
</html>
`;
}

function extractMain(html) {
  const match = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  return match ? match[1].trim() : "";
}

function frontMatter(page) {
  return [
    "---",
    `title: ${yamlString(page.title)}`,
    `seoTitle: ${yamlString(page.title)}`,
    `description: ${yamlString(page.description)}`,
    `keywords: ${yamlString(page.keywords)}`,
    "styles:",
    "  - '/css/style.css?v=20260602-layer-pages'",
    "  - '/css/about.css?v=20260602-layer-pages'",
    "  - '/css/products.css?v=20260602-layer-pages'",
    "---",
    ""
  ].join("\n");
}

for (const page of pages) {
  const html = renderPage(page);
  const sitePath = path.join(siteRoot, "products", page.slug, "index.html");
  fs.writeFileSync(sitePath, html, "utf8");

  const contentPath = path.join(contentRoot, "products", page.slug, "index.md");
  fs.mkdirSync(path.dirname(contentPath), { recursive: true });
  fs.writeFileSync(contentPath, `${frontMatter(page)}${extractMain(html)}\n`, "utf8");
}

console.log(`Rewrote ${pages.length} layer PCB product pages.`);
