﻿﻿﻿﻿﻿// Header Component
const headerTemplate = document.createElement('template');
headerTemplate.innerHTML = `
    <style>
        /* CSS 内容保持不变 */
        app-header {
            display: block;
            position: sticky;
            top: 0;
            z-index: 10000;
            background-color: #05140a;
            border-bottom: 2px solid #1a4225;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            overflow: visible;
        }
        :host {
            display: block;
            position: sticky;
            top: 0;
            z-index: 10000;
            background-color: #05140a;
            border-bottom: 2px solid #1a4225;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            overflow: visible;
        }
        .header-container {
            position: relative;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 40px;
            overflow: visible;
        }

        /* 背景 SVG 走线 */
        .pcb-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
            z-index: 0;
        }

        /* 导航内容 */
        .content {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
        }
        .logo {
            display: flex;
            align-items: center;
        }
        .logo img {
            height: 40px;
            display: block;
        }
        
        nav ul.nav-links {
            display: flex;
            gap: 24px;
            list-style: none;
            margin: 0;
            padding: 0;
            align-items: center;
        }
        
        nav ul.nav-links > li > a {
            color: var(--text-main);
            text-decoration: none;
            font-size: 1rem;
            font-weight: bold;
            transition: color 0.3s;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        nav ul.nav-links > li > a:hover {
            color: var(--pcb-glow);
        }

        /* Mega Menu 样式 */
        .has-dropdown {
            position: relative;
        }

        .dropdown-trigger {
            cursor: pointer;
        }

        .arrow {
            font-size: 0.7rem;
            transition: transform 0.3s ease;
            display: inline-block;
            margin-left: 3px;
        }

        .has-dropdown:hover .arrow,
        .has-dropdown.is-open .arrow {
            transform: rotate(180deg);
        }

        /* 桌面端 Mega Menu */
        .mega-menu {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            width: max-content;
            max-width: min(1120px, calc(100vw - 32px));
            background: rgba(5, 20, 10, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid var(--pcb-trace);
            border-top: 3px solid var(--pcb-glow);
            border-radius: 8px;
            padding: 30px;
            display: flex;
            gap: 40px;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 10001;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
            pointer-events: none;
            /* 确保在其他元素之上 */
        }

        /* 增加悬停触发区域，防止鼠标离开触发器时菜单立即消失 */
        .has-dropdown::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            height: 20px;
            background: transparent;
        }

        .has-dropdown:hover .mega-menu,
        .has-dropdown.is-open .mega-menu,
        .has-dropdown:focus-within .mega-menu {
            opacity: 1;
            visibility: visible;
            transform: translateX(-50%) translateY(10px); /* 留出一点空隙但处于激活区域 */
            pointer-events: auto;
        }

        .mega-column {
            min-width: 185px;
            max-width: 230px;
        }

        .mega-column h4 {
            color: #fff;
            font-size: 1.1rem;
            margin-bottom: 15px;
            border-bottom: 1px solid var(--pcb-trace);
            padding-bottom: 10px;
            display: block; /* 确保标题显示 */
        }

        .mega-column ul {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 0;
            margin: 0;
        }

        .mega-column ul li {
            display: block; /* 确保 li 正常显示 */
            width: 100%;
        }

        .mega-column a {
            color: var(--text-main);
            text-decoration: none;
            font-size: 0.95rem;
            transition: color 0.3s, padding-left 0.3s;
            display: inline-block;
        }

        .mega-column a:hover {
            color: var(--pcb-glow);
            padding-left: 5px;
        }
        
        .highlight-link {
            color: var(--pcb-glow) !important;
            font-weight: bold;
        }

        /* 移动端菜单适配 */
        .menu-toggle {
            display: none;
            flex-direction: column;
            cursor: pointer;
            gap: 6px;
        }
        .menu-toggle span {
            width: 30px;
            height: 3px;
            background-color: #00ff41;
            transition: 0.3s;
            border-radius: 2px;
        }

        /* 
         * 动画原理说明：
         * 1. stroke-dasharray: 80 2500; 定义路径为虚线。线段长 80px（模拟一截光束），间距 2500px（保证屏幕内通常只有一道光束）。
         * 2. stroke-dashoffset: 通过 @keyframes 动画让虚线偏移量从 2500 递减到 0，实现光束沿原走线路径"不断流动"的视觉错觉。
         */
        .beam {
            stroke-dasharray: 80 2500;
            stroke-linecap: round;
        }
        .beam-1 {
            animation: flow 4s linear infinite;
        }
        .beam-2 {
            animation: flow 5s linear infinite;
            animation-delay: -2s;
        }
        .beam-3 {
            animation: flow 6s linear infinite;
            animation-delay: -1s;
        }
        
        @keyframes flow {
            from { stroke-dashoffset: 2500; }
            to { stroke-dashoffset: 0; }
        }

        /* --- 响应式适配 (移动端) --- */
        @media (max-width: 992px) {
            .header-container { padding: 0 20px; }
            /* 移动端减弱复杂的走线背景，避免视觉干扰 */
            .pcb-bg { opacity: 0.3; } 
            
            .menu-toggle {
                display: flex;
                z-index: 2;
            }
            
            nav ul.nav-links {
                position: fixed;
                top: 80px;
                right: 0;
                width: 300px;
                height: calc(100vh - 80px);
                background: rgba(5, 20, 10, 0.98);
                backdrop-filter: blur(15px);
                flex-direction: column;
                align-items: flex-start;
                padding: 40px 20px;
                transform: translateX(100%);
                transition: transform 0.4s ease;
                overflow-y: auto;
                border-left: 1px solid var(--pcb-trace);
            }
            
            nav ul.nav-links.active {
                transform: translateX(0);
            }
            
            nav ul.nav-links > li {
                width: 100%;
                margin-bottom: 20px;
            }
            
            .mega-menu {
                position: static;
                transform: none;
                opacity: 1;
                visibility: visible;
                box-shadow: none;
                border: none;
                background: transparent;
                padding: 10px 0 0 15px;
                flex-direction: column;
                gap: 20px;
                display: none; /* 移动端默认隐藏下拉内容 */
                pointer-events: auto;
            }
            
            .has-dropdown:hover .mega-menu,
            .has-dropdown.is-open .mega-menu,
            .has-dropdown:focus-within .mega-menu {
                display: flex; /* 点击/悬停时展开 */
            }

            .mega-column h4 {
                font-size: 1rem;
                margin-bottom: 10px;
                color: var(--pcb-glow);
            }
        }
    </style>
    
    <div class="header-container">
        <!-- SVG PCB 走线和光束动画 -->
        <!-- 使用 preserveAspectRatio="xMidYMid slice" 保证 SVG 在任何屏幕宽度下都能铺满且不严重变形 -->
        <svg class="pcb-bg" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 80">
            <defs>
                <!-- SVG 滤镜：为光束添加外发光 (Glow) 效果 -->
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            
            <!-- 静态底图：深绿色走线和焊盘 -->
            <g stroke="#1a4225" stroke-width="2" fill="none">
                <path d="M-10,20 H300 L320,40 H800 L820,20 H1500 L1520,40 H1950" />
                <path d="M-10,60 H400 L420,30 H900 L920,60 H1400 L1420,30 H1950" />
                <path d="M600,80 L620,50 H1100 L1120,80" />
            </g>
            <g fill="#1a4225">
                <circle cx="300" cy="20" r="3"/>
                <circle cx="320" cy="40" r="3"/>
                <circle cx="400" cy="60" r="3"/>
                <circle cx="420" cy="30" r="3"/>
                <circle cx="800" cy="40" r="3"/>
                <circle cx="820" cy="20" r="3"/>
            </g>
            
            <!-- 动态光束：复制同样的路径，添加 .beam 动画类，并应用发光滤镜 -->
            <g stroke="#ffcc00" stroke-width="2" fill="none" filter="url(#glow)">
                <path class="beam beam-1" d="M-10,20 H300 L320,40 H800 L820,20 H1500 L1520,40 H1950" />
                <path class="beam beam-2" d="M-10,60 H400 L420,30 H900 L920,60 H1400 L1420,30 H1950" />
                <path class="beam beam-3" d="M600,80 L620,50 H1100 L1120,80" />
            </g>
        </svg>

        <div class="content">
            <a href="/" class="logo">
                <img src="/images/xf-logo.png" alt="XingFeng PCB Logo">
            </a>
            
            <!-- 移动端汉堡菜单按钮 -->
            <div class="menu-toggle">
                <span></span>
                <span></span>
                <span></span>
            </div>
            
            <!-- 导航菜单 -->
            <nav>
                <ul class="nav-links">
                    <li><a href="/">Home</a></li>

                    <li class="has-dropdown">
                        <a href="/products/" class="dropdown-trigger">Products <span class="arrow">▼</span></a>
                        <div class="mega-menu">
                            <div class="mega-column">
                                <h4>Layer Count</h4>
                                <ul>
                                    <li><a href="/products/1-layer-pcb/">1-Layer PCB</a></li>
                                    <li><a href="/products/2-layer-pcb/">2-Layer PCB</a></li>
                                    <li><a href="/products/4-layer-pcb/">4-Layer PCB</a></li>
                                    <li><a href="/products/6-layer-pcb/">6-Layer PCB</a></li>
                                    <li><a href="/products/8-layer-pcb/">8-Layer PCB</a></li>
                                    <li><a href="/products/10-layer-pcb/">10-Layer PCB</a></li>
                                </ul>
                            </div>
                            <div class="mega-column">
                                <h4>Advanced Layers</h4>
                                <ul>
                                    <li><a href="/products/12-layer-pcb/">12-Layer PCB</a></li>
                                    <li><a href="/products/14-layer-pcb/">14-Layer PCB</a></li>
                                    <li><a href="/products/16-layer-pcb/">16-Layer PCB</a></li>
                                    <li><a href="/products/20-layer-pcb/">20-Layer PCB</a></li>
                                    <li><a href="/products/24-layer-pcb/">24-Layer PCB</a></li>
                                    <li><a href="/products/32-layer-pcb/">32-Layer PCB</a></li>
                                    <li><a href="/products/40-layer-pcb/">40-Layer PCB</a></li>
                                </ul>
                            </div>
                            <div class="mega-column">
                                <h4>Specialty PCB</h4>
                                <ul>
                                    <li><a href="/pcb-manufacturing/hdi-pcb/">HDI PCB</a></li>
                                    <li><a href="/pcb-manufacturing/bga-pcb/">BGA PCB</a></li>
                                    <li><a href="/pcb-manufacturing/high-frequency-pcb/">High Frequency PCB</a></li>
                                    <li><a href="/pcb-manufacturing/impedance-control-pcb/">Impedance Control PCB</a></li>
                                    <li><a href="/pcb-manufacturing/heavy-copper-pcb/">Heavy Copper PCB</a></li>
                                    <li><a href="/pcb-manufacturing/high-tg-pcb/">High Tg PCB</a></li>
                                </ul>
                            </div>
                            <div class="mega-column">
                                <h4>Flex & Metal Core</h4>
                                <ul>
                                    <li><a href="/pcb-manufacturing/flexible-pcb/">Flexible PCB</a></li>
                                    <li><a href="/pcb-manufacturing/rigid-flex-pcb/">Rigid-Flex PCB</a></li>
                                    <li><a href="/pcb-manufacturing/aluminum-pcbs/">Aluminum PCB</a></li>
                                    <li><a href="/pcb-manufacturing/metal-core-pcb/">Metal Core PCB</a></li>
                                    <li><a href="/pcb-manufacturing/led-pcb-board/">LED PCB Board</a></li>
                                    <li><a href="/products/multilayer-pcb/">Multilayer PCB Guide</a></li>
                                </ul>
                            </div>
                        </div>
                    </li>

                    <li class="has-dropdown">
                        <a href="/pcb-manufacturing/" class="dropdown-trigger">Services <span class="arrow">▼</span></a>
                        <div class="mega-menu">
                            <div class="mega-column">
                                <h4>PCB Fabrication</h4>
                                <ul>
                                    <li><a href="/prototype-pcb/">PCB Prototype</a></li>
                                    <li><a href="/pcb-manufacturing/">PCB Manufacturing</a></li>
                                    <li><a href="/pcb-manufacturing/custom-circuit-board-printing/">Custom PCB</a></li>
                                    <li><a href="/pcb-manufacturing/quick-turn-pcb/">Quick Turn PCB</a></li>
                                    <li><a href="/pcb-manufacturing/low-cost-pcbs-fabrication/">Low Cost PCB</a></li>
                                    <li><a href="/pcb-manufacturing/pcb-mass-production/">PCB Mass Production</a></li>
                                </ul>
                            </div>
                            <div class="mega-column">
                                <h4>PCB Assembly</h4>
                                <ul>
                                    <li><a href="/pcba-manufacturing/">PCBA Manufacturing</a></li>
                                    <li><a href="/pcb-assembly/">PCB Assembly</a></li>
                                    <li><a href="/pcb-assembly/smt-pcb-assembly/">SMT PCB Assembly</a></li>
                                    <li><a href="/pcb-assembly/through-hole-pcb-assembly/">Through-Hole Assembly</a></li>
                                    <li><a href="/pcb-assembly/full-turnkey-pcb-assembly-service/">Turnkey PCB Assembly</a></li>
                                    <li><a href="/pcb-assembly/components-purchasing-services/">Component Sourcing</a></li>
                                </ul>
                            </div>
                            <div class="mega-column">
                                <h4>Assembly Types</h4>
                                <ul>
                                    <li><a href="/pcb-assembly/fast-prototype-pcb-assembly-service/">Prototype PCB Assembly</a></li>
                                    <li><a href="/pcb-assembly/quick-turn-pcb-assembly/">Quick Turn PCB Assembly</a></li>
                                    <li><a href="/pcb-assembly/low-volume-assembly-service/">Low Volume Assembly</a></li>
                                    <li><a href="/pcb-assembly/high-volume-pcb-assembly-services/">High Volume Assembly</a></li>
                                    <li><a href="/pcb-assembly/lead-free-pcb-assembly-service/">Lead-Free Assembly</a></li>
                                    <li><a href="/pcb-assembly/led-pcb-assembly/">LED PCB Assembly</a></li>
                                </ul>
                            </div>
                            <div class="mega-column">
                                <h4>Stencil Services</h4>
                                <ul>
                                    <li><a href="/pcb-assembly/pcb-smt-stencil/">PCB SMT Stencil</a></li>
                                    <li><a href="/laser-cut-smt-stencil/">Laser Cut SMT Stencil</a></li>
                                    <li><a href="/step-stencil/">Step Stencil</a></li>
                                    <li><a href="/nano-coating-pcb-stencil-manufacturing/">Nano-Coating Stencil</a></li>
                                    <li><a href="/custom-electroform-stencils/">Electroform Stencils</a></li>
                                </ul>
                            </div>
                        </div>
                    </li>

                    <li class="has-dropdown">
                        <a href="/technical-capabilities/" class="dropdown-trigger">Capabilities <span class="arrow">▼</span></a>
                        <div class="mega-menu">
                            <div class="mega-column">
                                <h4>Factory Capability</h4>
                                <ul>
                                    <li><a href="/technical-capabilities/">PCB Capabilities</a></li>
                                    <li><a href="/pcb-fabrication-process/">PCB Fabrication Process</a></li>
                                    <li><a href="/technical-capabilities/rigid-pcb-fabrication-capability/">Rigid PCB Capability</a></li>
                                    <li><a href="/technical-capabilities/flexible-pcb-fabrication-capability/">Flexible PCB Capability</a></li>
                                    <li><a href="/technical-capabilities/rigid-flex-pcb-fabrication-capability/">Rigid-Flex Capability</a></li>
                                </ul>
                            </div>
                            <div class="mega-column">
                                <h4>Advanced Process</h4>
                                <ul>
                                    <li><a href="/technical-capabilities/hdi-pcb-board-fabrication-capabilities/">HDI PCB Capability</a></li>
                                    <li><a href="/technical-capabilities/pcb-copper-thickness-capabilities/">Copper Thickness Capability</a></li>
                                    <li><a href="/pcb-assembly/pcb-assembly-capability/">PCB Assembly Capability</a></li>
                                    <li><a href="/pcb-assembly/pcb-stencil-capability/">SMT Stencil Capability</a></li>
                                </ul>
                            </div>
                            <div class="mega-column">
                                <h4>Testing & Resources</h4>
                                <ul>
                                    <li><a href="/pcb-board-testing-and-inspection/">Testing & Inspection</a></li>
                                    <li><a href="/pcb-board-testing-and-inspection/flying-probe-testing-for-pcb/">Flying Probe Testing</a></li>
                                    <li><a href="/pcb-board-testing-and-inspection/x-ray-inspection-in-pcb-assembly/">X-Ray Inspection</a></li>
                                    <li><a href="/pcb-materials/">PCB Materials</a></li>
                                    <li><a href="/support/pcb-pcba-manufacturing-file/">Manufacturing Files</a></li>
                                </ul>
                            </div>
                        </div>
                    </li>

                    <li class="has-dropdown">
                        <a href="/applications-and-industries-served/" class="dropdown-trigger">Industries <span class="arrow">▼</span></a>
                        <div class="mega-menu">
                            <div class="mega-column">
                                <h4>Applications</h4>
                                <ul>
                                    <li><a href="/applications-and-industries-served/">Industries Served</a></li>
                                    <li><a href="/applications-and-industries-served/pcbs-for-consumer-electronics/">Consumer Electronics</a></li>
                                    <li><a href="/applications-and-industries-served/new-energy-pcbs/">New Energy</a></li>
                                    <li><a href="/applications-and-industries-served/new-energy-vehicle-pcb/">New Energy Vehicle</a></li>
                                    <li><a href="/applications-and-industries-served/pcbs-for-automobile-electronics/">Automobile Electronics</a></li>
                                    <li><a href="/applications-and-industries-served/pcbs-for-medical-devices/">Medical Devices</a></li>
                                </ul>
                            </div>
                            <div class="mega-column">
                                <h4>More Industries</h4>
                                <ul>
                                    <li><a href="/applications-and-industries-served/pcbs-for-industrial-control-applications/">Industrial Control</a></li>
                                    <li><a href="/applications-and-industries-served/pcbs-for-communication-equipment/">Communication Equipment</a></li>
                                    <li><a href="/applications-and-industries-served/server-and-data-storage-pcbs/">Server & Data Storage</a></li>
                                    <li><a href="/applications-and-industries-served/security-and-access-control-systems-pcbs/">Security Systems</a></li>
                                    <li><a href="/applications-and-industries-served/pcbs-for-aerospace-and-defence/">Aerospace & Defense</a></li>
                                    <li><a href="/applications-and-industries-served/pcbs-for-led-lighting/">LED Lighting</a></li>
                                </ul>
                            </div>
                        </div>
                    </li>

                    <li class="has-dropdown">
                        <a href="/sitemap/" class="dropdown-trigger">Info <span class="arrow">▼</span></a>
                        <div class="mega-menu">
                            <div class="mega-column">
                                <h4>Company</h4>
                                <ul>
                                    <li><a href="/about/">About Us</a></li>
                                    <li><a href="/pcb-manufacturer/">China PCB Manufacturer</a></li>
                                    <li><a href="/pcb-manufacturer/pcb-factory/">PCB Factory</a></li>
                                    <li><a href="/pcb-manufacturer/quality-management/">Quality Management</a></li>
                                    <li><a href="/pcb-manufacturer/why-us/">Why Choose XFPCB</a></li>
                                </ul>
                            </div>
                            <div class="mega-column">
                                <h4>Guides & Support</h4>
                                <ul>
                                    <li><a href="/how-to-place-an-order/">Order Guide</a></li>
                                    <li><a href="/support/">Technical Support</a></li>
                                    <li><a href="/support/pcb-terminology-glossary/">PCB Glossary</a></li>
                                    <li><a href="/pcb-manufacturer-usa-vs-china/">USA vs China PCB Guide</a></li>
                                    <li><a href="/pcb-manufacturer-in-vietnam-vs-china/">Vietnam vs China PCB Guide</a></li>
                                </ul>
                            </div>
                            <div class="mega-column">
                                <h4>Policies</h4>
                                <ul>
                                    <li><a href="/privacy/">Privacy Policy</a></li>
                                    <li><a href="/terms/">Terms of Service</a></li>
                                    <li><a href="/sitemap/">HTML Sitemap</a></li>
                                </ul>
                            </div>
                        </div>
                    </li>
                </ul>
            </nav>
        </div>
    </div>
`;

class AppHeader extends HTMLElement {
    constructor() {
        super();
        // SEO 优化：为了让搜索引擎蜘蛛能爬取到实体的 <a> 标签锚文本，
        // 我们放弃使用 Shadow DOM (this.attachShadow)，而是直接操作普通 DOM (Light DOM)。
    }

    connectedCallback() {
        // 先清空为 SEO 准备的实体锚文本 fallback 内容
        this.innerHTML = '';
        
        // 将模板内容直接克隆并追加到当前自定义标签 (<app-header>) 内部
        this.appendChild(headerTemplate.content.cloneNode(true));

        // 组件挂载时，绑定移动端汉堡菜单交互事件
        const toggleBtn = this.querySelector('.menu-toggle');
        const navUl = this.querySelector('nav ul.nav-links');
        
        if(toggleBtn && navUl) {
            toggleBtn.addEventListener('click', () => {
                navUl.classList.toggle('active');
            });
        }

        this.querySelectorAll('.has-dropdown').forEach((dropdown) => {
            const trigger = dropdown.querySelector('.dropdown-trigger');
            if (!trigger) return;

            trigger.setAttribute('aria-haspopup', 'true');
            trigger.setAttribute('aria-expanded', 'false');

            const openMenu = () => {
                dropdown.classList.add('is-open');
                trigger.setAttribute('aria-expanded', 'true');
            };

            const closeMenu = () => {
                dropdown.classList.remove('is-open');
                trigger.setAttribute('aria-expanded', 'false');
            };

            dropdown.addEventListener('mouseenter', openMenu);
            dropdown.addEventListener('mouseleave', closeMenu);
            dropdown.addEventListener('focusin', openMenu);
            dropdown.addEventListener('focusout', (event) => {
                if (!dropdown.contains(event.relatedTarget)) {
                    closeMenu();
                }
            });

            trigger.addEventListener('click', (event) => {
                if (window.matchMedia('(max-width: 992px)').matches) {
                    event.preventDefault();
                    if (dropdown.classList.contains('is-open')) {
                        closeMenu();
                    } else {
                        openMenu();
                    }
                }
            });
        });
    }
}

// 注册自定义组件 <app-header>
customElements.define('app-header', AppHeader);
