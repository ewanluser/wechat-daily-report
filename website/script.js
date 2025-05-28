 // DOM Elements
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navbar = document.querySelector('.navbar');
const thumbnails = document.querySelectorAll('.thumbnail');
const mainScreenshot = document.getElementById('mainScreenshot');

// Mobile Navigation Toggle
hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger?.classList.remove('active');
        navMenu?.classList.remove('active');
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar?.classList.add('scrolled');
    } else {
        navbar?.classList.remove('scrolled');
    }
});

// Screenshot gallery functionality
thumbnails.forEach(thumbnail => {
    thumbnail.addEventListener('click', () => {
        // Remove active class from all thumbnails
        thumbnails.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked thumbnail
        thumbnail.classList.add('active');
        
        // Update main screenshot
        const newSrc = thumbnail.dataset.src;
        if (mainScreenshot && newSrc) {
            mainScreenshot.src = newSrc;
            mainScreenshot.alt = thumbnail.querySelector('img').alt;
        }
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.feature-card, .download-card, .step, .tech-item, .contact-item').forEach(el => {
    observer.observe(el);
});

// Download button click tracking (optional analytics)
document.querySelectorAll('.btn-download').forEach(button => {
    button.addEventListener('click', function(e) {
        const platform = this.closest('.download-card')?.querySelector('h3')?.textContent;
        console.log(`Download clicked for: ${platform}`);
        
        // Add download animation
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 下载中...';
        this.style.pointerEvents = 'none';
        
        setTimeout(() => {
            this.innerHTML = originalText;
            this.style.pointerEvents = 'auto';
        }, 2000);
    });
});

// Floating shapes animation optimization
const shapes = document.querySelectorAll('.shape');
let animationId;

function animateShapes() {
    shapes.forEach((shape, index) => {
        const speed = 0.5 + index * 0.1;
        const range = 20 + index * 5;
        const time = Date.now() * 0.001 * speed;
        
        const x = Math.sin(time) * range;
        const y = Math.cos(time * 1.2) * range;
        const rotation = time * 20;
        
        shape.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
    });
    
    animationId = requestAnimationFrame(animateShapes);
}

// Start shape animation when page loads
window.addEventListener('load', () => {
    animateShapes();
});

// Pause animation when tab is not visible
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cancelAnimationFrame(animationId);
    } else {
        animateShapes();
    }
});

// Stats counter animation
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = counter.textContent;
        const numTarget = parseInt(target.replace(/[^\d]/g, ''));
        const suffix = target.replace(/[\d]/g, '');
        
        if (numTarget) {
            let current = 0;
            const increment = numTarget / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= numTarget) {
                    counter.textContent = numTarget + suffix;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current) + suffix;
                }
            }, 30);
        }
    });
}

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            statsObserver.disconnect();
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.hero-stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.floating-shapes');
    
    parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Copy to clipboard functionality (if needed for API keys, etc.)
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show success message
        showNotification('已复制到剪贴板！', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showNotification('复制失败，请手动复制', 'error');
    });
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        backgroundColor: type === 'success' ? '#10b981' : 
                        type === 'error' ? '#ef4444' : '#4f46e5'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
    // ESC key closes mobile menu
    if (e.key === 'Escape') {
        hamburger?.classList.remove('active');
        navMenu?.classList.remove('active');
    }
    
    // Arrow keys for screenshot gallery
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const activeThumbnail = document.querySelector('.thumbnail.active');
        if (activeThumbnail) {
            const thumbnailArray = Array.from(thumbnails);
            const currentIndex = thumbnailArray.indexOf(activeThumbnail);
            let nextIndex;
            
            if (e.key === 'ArrowLeft') {
                nextIndex = currentIndex > 0 ? currentIndex - 1 : thumbnailArray.length - 1;
            } else {
                nextIndex = currentIndex < thumbnailArray.length - 1 ? currentIndex + 1 : 0;
            }
            
            thumbnailArray[nextIndex].click();
        }
    }
});

// Lazy loading for images
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        }
    });
});

document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
});

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Replace direct scroll event listeners with debounced versions
const debouncedScrollHandler = debounce(() => {
    if (window.scrollY > 100) {
        navbar?.classList.add('scrolled');
    } else {
        navbar?.classList.remove('scrolled');
    }
}, 10);

window.addEventListener('scroll', debouncedScrollHandler);

// Preload critical images
function preloadImages() {
    const criticalImages = [
        './images/product.png',
        './images/wx.jpg'
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Initialize preloading when page loads
window.addEventListener('load', preloadImages);

// Error handling for broken images
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function() {
        this.style.display = 'none';
        console.warn(`Failed to load image: ${this.src}`);
    });
});

// Add loading states for download buttons
document.querySelectorAll('.btn-download').forEach(button => {
    button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    
    button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

console.log('🗞️ 微信群聊日报生成器官网已加载完成！');

// SEO优化相关功能

// 页面加载性能监控
window.addEventListener('load', () => {
    // 记录页面加载时间
    const loadTime = performance.now();
    console.log(`页面加载时间: ${loadTime.toFixed(2)}ms`);
    
    // 预加载关键图片
    preloadCriticalImages();
    
    // 延迟加载非关键资源
    setTimeout(() => {
        lazyLoadImages();
    }, 100);
});

// 预加载关键图片
function preloadCriticalImages() {
    const criticalImages = [
        './images/product.png',
        './images/wx.jpg'
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// 懒加载图片
function lazyLoadImages() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

// 社交分享功能
function shareToSocial(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    const description = encodeURIComponent(document.querySelector('meta[name="description"]').content);
    
    let shareUrl = '';
    
    switch(platform) {
        case 'weibo':
            shareUrl = `https://service.weibo.com/share/share.php?url=${url}&title=${title}&pic=`;
            break;
        case 'qq':
            shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}&desc=${description}`;
            break;
        case 'wechat':
            // 微信分享需要特殊处理，这里显示二维码
            showWeChatShareQR();
            return;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

// 显示微信分享二维码
function showWeChatShareQR() {
    // 这里可以集成二维码生成库
    showNotification('请复制链接到微信分享', 'info');
    copyToClipboard(window.location.href);
}

// 页面访问统计（可选）
function trackPageView() {
    // 这里可以集成Google Analytics或其他统计工具
    if (typeof gtag !== 'undefined') {
        gtag('config', 'GA_MEASUREMENT_ID', {
            page_title: document.title,
            page_location: window.location.href
        });
    }
}

// 搜索引擎优化相关
function updatePageMeta(title, description, keywords) {
    // 动态更新页面meta信息
    document.title = title;
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.content = description;
    }
    
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
        metaKeywords.content = keywords;
    }
    
    // 更新Open Graph标签
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
        ogTitle.content = title;
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
        ogDescription.content = description;
    }
}

// 结构化数据验证
function validateStructuredData() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(script => {
        try {
            JSON.parse(script.textContent);
            console.log('结构化数据验证通过');
        } catch (e) {
            console.error('结构化数据格式错误:', e);
        }
    });
}

// 页面可访问性检查
function checkAccessibility() {
    // 检查图片alt属性
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.alt) {
            console.warn('图片缺少alt属性:', img.src);
        }
    });
    
    // 检查链接是否有描述性文本
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        if (!link.textContent.trim() && !link.getAttribute('aria-label')) {
            console.warn('链接缺少描述性文本:', link.href);
        }
    });
}

// 页面性能优化
function optimizePerformance() {
    // 防抖滚动事件
    const debouncedScroll = debounce(() => {
        // 滚动相关的性能敏感操作
        updateScrollProgress();
    }, 16); // 60fps
    
    window.addEventListener('scroll', debouncedScroll, { passive: true });
}

// 更新滚动进度
function updateScrollProgress() {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    
    // 可以用于显示阅读进度条
    document.documentElement.style.setProperty('--scroll-progress', `${scrollPercent}%`);
}

// 初始化SEO相关功能
document.addEventListener('DOMContentLoaded', () => {
    validateStructuredData();
    checkAccessibility();
    optimizePerformance();
    trackPageView();
});

// 导出函数供外部使用
window.WeChatDailyReport = {
    shareToSocial,
    updatePageMeta,
    copyToClipboard,
    showNotification
}; 