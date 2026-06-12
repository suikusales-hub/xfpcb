/**
 * js/components/footer.js
 * 
 * 解耦原理同 header.js，使用 Web Components 实现页脚隔离。
 */
const footerTemplate = document.createElement('template');
footerTemplate.innerHTML = `
    <style>
        :host {
            display: block;
            background-color: #05140a;
            border-top: 2px solid #1a4225;
            position: relative;
            overflow: hidden;
        }
        .footer-container {
            position: relative;
            padding: 40px 20px 20px;
            min-height: 200px;
            color: #8da696;
            text-align: center;
        }
        .pcb-bg {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0.6;
        }
        .content {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        .footer-logo {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        .footer-logo img {
            height: 40px;
            display: block;
            opacity: 0.9;
            transition: opacity 0.3s;
        }
        .footer-logo:hover img {
            opacity: 1;
        }
        .footer-groups {
            display: grid;
            grid-template-columns: repeat(5, minmax(150px, 1fr));
            gap: 26px;
            width: min(1120px, 100%);
            text-align: left;
        }
        .footer-group h4 {
            color: #fff;
            font-size: 1rem;
            margin: 0 0 12px;
            border-bottom: 1px solid #1a4225;
            padding-bottom: 8px;
        }
        .footer-group a {
            display: block;
            color: #e0f2e6;
            text-decoration: none;
            font-size: 0.92rem;
            line-height: 1.45;
            margin-bottom: 9px;
            transition: color 0.3s;
        }
        .footer-group a:hover {
            color: #00ff41;
        }
        .copyright {
            font-size: 14px;
            margin-top: 20px;
            border-top: 1px solid #1a4225;
            padding-top: 20px;
            width: 100%;
            max-width: 600px;
        }

        /* 光束动画：页脚的光束从右向左、自下而上流动，营造不同的科技感 */
        .beam {
            stroke-dasharray: 100 2500;
            stroke-linecap: round;
        }
        .beam-footer-1 {
            animation: flow-reverse 5s linear infinite;
        }
        .beam-footer-2 {
            animation: flow-reverse 4s linear infinite;
            animation-delay: -1.5s;
        }
        
        @keyframes flow-reverse {
            from { stroke-dashoffset: -2500; }
            to { stroke-dashoffset: 0; }
        }

        @media (max-width: 768px) {
            .pcb-bg { opacity: 0.2; }
            .footer-groups { grid-template-columns: 1fr; text-align: center; }
        }
    </style>
    
    <div class="footer-container">
        <!-- 页脚 SVG 动画背景 -->
        <svg class="pcb-bg" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 200">
            <defs>
                <filter id="glow-footer" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            
            <g stroke="#1a4225" stroke-width="2" fill="none">
                <path d="M-10,180 H400 L450,130 H1200 L1250,170 H1950" />
                <path d="M-10,150 H200 L250,100 H800 L850,150 H1600 L1650,120 H1950" />
                <!-- 垂直短分支，增加电路板真实感 -->
                <path d="M400,180 V140" />
                <path d="M1200,130 V90" />
            </g>
            <g fill="#1a4225">
                <circle cx="400" cy="180" r="3"/>
                <circle cx="450" cy="130" r="3"/>
                <circle cx="200" cy="150" r="3"/>
                <circle cx="250" cy="100" r="3"/>
                <circle cx="400" cy="140" r="3"/>
                <circle cx="1200" cy="90" r="3"/>
            </g>
            
            <!-- 动态光束 -->
            <g stroke="#ffcc00" stroke-width="2" fill="none" filter="url(#glow-footer)">
                <path class="beam beam-footer-1" d="M-10,180 H400 L450,130 H1200 L1250,170 H1950" />
                <path class="beam beam-footer-2" d="M-10,150 H200 L250,100 H800 L850,150 H1600 L1650,120 H1950" />
            </g>
        </svg>

        <div class="content">
            <a href="/" class="footer-logo">
                <img src="/images/xf-logo.png" alt="XingFeng PCB Logo">
            </a>
            <div class="footer-groups">
                <div class="footer-group">
                    <h4>PCB Manufacturing</h4>
                    <a href="/prototype-pcb/">PCB Prototype</a>
                    <a href="/pcb-manufacturing/">PCB Manufacturing</a>
                    <a href="/pcb-manufacturing/quick-turn-pcb/">Quick Turn PCB</a>
                    <a href="/pcb-manufacturing/hdi-pcb/">HDI PCB</a>
                    <a href="/pcb-manufacturing/flexible-pcb/">Flexible PCB</a>
                    <a href="/pcb-manufacturing/rigid-flex-pcb/">Rigid-Flex PCB</a>
                </div>
                <div class="footer-group">
                    <h4>PCB Assembly</h4>
                    <a href="/pcba-manufacturing/">PCBA Manufacturing</a>
                    <a href="/pcb-assembly/">PCB Assembly</a>
                    <a href="/pcb-assembly/smt-pcb-assembly/">SMT Assembly</a>
                    <a href="/pcb-assembly/full-turnkey-pcb-assembly-service/">Turnkey Assembly</a>
                    <a href="/pcb-assembly/components-purchasing-services/">Component Sourcing</a>
                    <a href="/pcb-assembly/pcb-smt-stencil/">SMT Stencil</a>
                </div>
                <div class="footer-group">
                    <h4>Capabilities</h4>
                    <a href="/technical-capabilities/">PCB Capabilities</a>
                    <a href="/pcb-fabrication-process/">Fabrication Process</a>
                    <a href="/pcb-board-testing-and-inspection/">Testing & Inspection</a>
                    <a href="/pcb-materials/">PCB Materials</a>
                    <a href="/technical-capabilities/pcb-copper-thickness-capabilities/">Copper Thickness</a>
                    <a href="/products/high-layer-count-pcb/">High Layer Count PCB</a>
                </div>
                <div class="footer-group">
                    <h4>Industries</h4>
                    <a href="/applications-and-industries-served/">Industries Served</a>
                    <a href="/applications-and-industries-served/pcbs-for-consumer-electronics/">Consumer Electronics</a>
                    <a href="/applications-and-industries-served/new-energy-pcbs/">New Energy</a>
                    <a href="/applications-and-industries-served/pcbs-for-automobile-electronics/">Automobile Electronics</a>
                    <a href="/applications-and-industries-served/pcbs-for-medical-devices/">Medical Devices</a>
                    <a href="/applications-and-industries-served/pcbs-for-led-lighting/">LED Lighting</a>
                </div>
                <div class="footer-group">
                    <h4>Company & Support</h4>
                    <a href="/about/">About Us</a>
                    <a href="/pcb-manufacturer/">China PCB Manufacturer</a>
                    <a href="/pcb-manufacturer/pcb-factory/">PCB Factory</a>
                    <a href="/support/">Technical Support</a>
                    <a href="/privacy/">Privacy Policy</a>
                    <a href="/terms/">Terms of Service</a>
                    <a href="/sitemap/">Sitemap</a>
                </div>
            </div>
            <div class="copyright">
                &copy; 2026 XingFeng PCB. All Rights Reserved.
            </div>
        </div>
    </div>
`;

class AppFooter extends HTMLElement {
    constructor() {
        super();
        // SEO 优化：放弃使用 Shadow DOM，改用 Light DOM，以便搜索引擎抓取实体 <a> 标签
    }

    connectedCallback() {
        // 清空 SEO fallback 内容
        this.innerHTML = '';
        this.appendChild(footerTemplate.content.cloneNode(true));
    }
}

// 注册自定义组件 <app-footer>
customElements.define('app-footer', AppFooter);
