class FloatingForm extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        // 动态获取当前页面的完整 URL
        const currentUrl = window.location.href;

        this.innerHTML = `
        <style>
            /* 悬浮表单容器 */
            .floating-form-wrapper {
                position: fixed;
                right: 0;
                top: 50%;
                transform: translate(100%, -50%);
                width: 360px;
                background: rgba(5, 20, 10, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid var(--pcb-trace);
                border-left: 3px solid var(--pcb-glow);
                box-shadow: -5px 0 20px rgba(0, 0, 0, 0.5);
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 9999;
                border-radius: 8px 0 0 8px;
            }

            /* 悬浮按钮 (联系我们) */
            .floating-toggle-btn {
                position: absolute;
                left: -45px;
                top: 50%;
                transform: translateY(-50%);
                background: var(--pcb-glow);
                color: var(--pcb-dark);
                border: none;
                padding: 15px 10px;
                cursor: pointer;
                writing-mode: vertical-rl;
                text-orientation: mixed;
                font-weight: bold;
                font-size: 1rem;
                letter-spacing: 2px;
                border-radius: 8px 0 0 8px;
                box-shadow: -2px 0 10px rgba(0, 255, 65, 0.3);
                transition: background 0.3s, transform 0.3s;
            }

            .floating-toggle-btn:hover {
                background: #fff;
                transform: translateY(-50%) scale(1.05);
            }

            /* 当抽屉展开时的状态 */
            .floating-form-wrapper.is-open {
                transform: translate(0, -50%);
            }

            /* 表单头部关闭按钮 */
            .form-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                border-bottom: 1px solid var(--pcb-trace);
            }

            .form-header h3 {
                color: var(--pcb-glow);
                margin: 0;
                font-size: 1.2rem;
            }

            .close-form-btn {
                background: none;
                border: none;
                color: #fff;
                font-size: 1.5rem;
                cursor: pointer;
                line-height: 1;
                padding: 0 5px;
                transition: color 0.3s;
            }

            .close-form-btn:hover {
                color: #ff4444;
            }

            /* 表单主体样式覆盖 (保持原有 name 属性，仅美化外观以匹配网站主题) */
            .web3-form {
                margin: 0 !important;
                padding: 20px !important;
                border: none !important;
            }

            .web3-form label {
                color: var(--text-main) !important;
                font-size: 0.95rem;
            }

            .web3-form input[type="text"],
            .web3-form input[type="email"],
            .web3-form textarea {
                background: rgba(255, 255, 255, 0.05) !important;
                border: 1px solid var(--pcb-trace) !important;
                color: #fff !important;
                transition: border-color 0.3s, box-shadow 0.3s;
            }

            .web3-form input[type="text"]:focus,
            .web3-form input[type="email"]:focus,
            .web3-form textarea:focus {
                outline: none;
                border-color: var(--pcb-glow) !important;
                box-shadow: 0 0 8px rgba(0, 255, 65, 0.2);
            }

            .web3-form button[type="submit"] {
                background: var(--pcb-glow) !important;
                color: var(--pcb-dark) !important;
                width: 100%;
                text-transform: uppercase;
                letter-spacing: 1px;
                transition: background 0.3s, transform 0.2s;
            }

            .web3-form button[type="submit"]:hover {
                background: #fff !important;
                transform: translateY(-2px);
            }
            
            /* 移动端适配 */
            @media (max-width: 768px) {
                .floating-form-wrapper {
                    width: 300px;
                }
            }
        </style>

        <div class="floating-form-wrapper" id="floatingDrawer">
            <!-- 悬浮触发按钮 -->
            <button class="floating-toggle-btn" id="toggleFormBtn">Contact Us</button>

            <!-- 内部头部 -->
            <div class="form-header">
                <h3>Quick Inquiry</h3>
                <button class="close-form-btn" id="closeFormBtn">&times;</button>
            </div>

            <!-- 用户提供的原生 Web3Forms 表单 (仅修改了 page_url 的 value 注入和 class 用于外观覆盖) -->
            <form class="web3-form" action="https://api.web3forms.com/submit" method="POST" style="margin: 2rem 0; padding: 1.5rem; border: 1px solid #eee; border-radius: 8px;"> 
                <!-- 核心配置 --> 
                <input type="hidden" name="access_key" value="40f0bc17-2a5a-45e0-85cf-99aa9d8b06df"> 
                <input type="hidden" name="honeypot" style="display:none;"> 
                <!-- 动态注入当前页面 URL -->
                <input type="hidden" name="page_url" value="${currentUrl}"> 
                <input type="hidden" name="subject" value="Product Inquiry from ${currentUrl}"> 
                <input type="hidden" name="redirect" value="https://xfpcb.com/"> <!-- 提交成功跳转回首页或感谢页 --> 

                <!-- 表单字段（英文） --> 
                <div style="margin-bottom: 1rem;"> 
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Your Name *</label> 
                    <input type="text" name="name" placeholder="John Doe" required style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 4px;"> 
                </div> 
                
                <div style="margin-bottom: 1rem;"> 
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Your Email *</label> 
                    <input type="email" name="email" placeholder="john@example.com" required style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 4px;"> 
                </div> 
                
                <div style="margin-bottom: 1rem;"> 
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Your Message / Requirements *</label> 
                    <textarea name="message" placeholder="Please describe your requirements..." required style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 4px; min-height: 120px;"></textarea> 
                </div> 

                <button type="submit" style="background: #2563eb; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: 600;"> 
                    Send Inquiry 
                </button> 
            </form>
        </div>
        `;

        // 绑定抽屉开关事件
        const drawer = this.querySelector('#floatingDrawer');
        const toggleBtn = this.querySelector('#toggleFormBtn');
        const closeBtn = this.querySelector('#closeFormBtn');

        toggleBtn.addEventListener('click', () => {
            drawer.classList.toggle('is-open');
        });

        closeBtn.addEventListener('click', () => {
            drawer.classList.remove('is-open');
        });
    }
}

customElements.define('floating-form', FloatingForm);
