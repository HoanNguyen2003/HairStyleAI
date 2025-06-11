import React from 'react';
import '../styles/About.scss';

function About() {
  const teamMembers = [
    {
      id: 1,
      name: "Dr. AI Nguyen",
      role: "AI Research Lead",
      avatar: "https://via.placeholder.com/150x150/4CAF50/ffffff?text=AI",
      description: "Chuyên gia về Computer Vision và Deep Learning, phát triển thuật toán HairFastGAN"
    },
    {
      id: 2,
      name: "Blockchain Developer",
      role: "Web3 & Smart Contract",
      avatar: "https://via.placeholder.com/150x150/2196F3/ffffff?text=BC",
      description: "Architect của hệ thống NFT marketplace và smart contracts trên Ethereum"
    },
    {
      id: 3,
      name: "Frontend Engineer",
      role: "UI/UX & Web Development",
      avatar: "https://via.placeholder.com/150x150/FF9800/ffffff?text=FE",
      description: "Thiết kế và phát triển giao diện người dùng responsive với React"
    }
  ];

  const technologies = [
    {
      category: "AI & Machine Learning",
      items: [
        { name: "HairFastGAN", description: "Mô hình AI tiên tiến cho việc thay đổi kiểu tóc" },
        { name: "PyTorch", description: "Framework deep learning chính" },
        { name: "Computer Vision", description: "Xử lý và phân tích hình ảnh" },
        { name: "Google Gemini AI", description: "Chatbot tư vấn thông minh" }
      ]
    },
    {
      category: "Blockchain & Web3",
      items: [
        { name: "Ethereum", description: "Blockchain platform cho NFT" },
        { name: "Solidity", description: "Smart contracts ERC-721" },
        { name: "MetaMask", description: "Wallet integration" },
        { name: "IPFS", description: "Decentralized storage cho NFT metadata" }
      ]
    },
    {
      category: "Frontend & Backend",
      items: [
        { name: "React.js", description: "Modern UI framework" },
        { name: "Node.js + Express", description: "Backend API server" },
        { name: "SCSS", description: "Advanced CSS styling" },
        { name: "Web3.js/Ethers.js", description: "Blockchain interaction" }
      ]
    }
  ];

  const features = [
    {
      icon: "🎨",
      title: "AI Hair Styling",
      description: "Sử dụng công nghệ HairFastGAN để tạo ra những kiểu tóc mới chỉ trong vài giây"
    },
    {
      icon: "🏪",
      title: "NFT Marketplace",
      description: "Mint, mua bán NFT kiểu tóc độc quyền trên blockchain Ethereum"
    },
    {
      icon: "💬",
      title: "AI Chatbot",
      description: "Tư vấn kiểu tóc phù hợp với khuôn mặt và phong cách cá nhân"
    },
    {
      icon: "🔗",
      title: "Web3 Integration",
      description: "Kết nối MetaMask, quản lý NFT, giao dịch an toàn trên blockchain"
    },
    {
      icon: "📱",
      title: "Responsive Design",
      description: "Giao diện tối ưu cho cả desktop và mobile"
    },
    {
      icon: "⚡",
      title: "Real-time Processing",
      description: "Xử lý ảnh nhanh chóng với kết quả chất lượng cao"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Ảnh được xử lý", icon: "📸" },
    { number: "500+", label: "NFT được mint", icon: "🎨" },
    { number: "50+", label: "Giao dịch NFT", icon: "💰" },
    { number: "1,000+", label: "Người dùng", icon: "👥" }
  ];

  const roadmap = [
    {
      phase: "Phase 1",
      title: "AI Hair Styling Platform",
      status: "completed",
      items: [
        "✅ Tích hợp HairFastGAN model",
        "✅ Giao diện upload và xử lý ảnh",
        "✅ Backend API cho AI processing"
      ]
    },
    {
      phase: "Phase 2", 
      title: "Web3 & NFT Integration",
      status: "completed",
      items: [
        "✅ Smart contracts (ERC-721)",
        "✅ MetaMask wallet integration",
        "✅ NFT minting functionality",
        "✅ IPFS metadata storage"
      ]
    },
    {
      phase: "Phase 3",
      title: "Marketplace & Trading",
      status: "completed",
      items: [
        "✅ NFT marketplace",
        "✅ Buy/sell functionality",
        "✅ Real-time ownership tracking",
        "✅ AI chatbot integration"
      ]
    },
    {
      phase: "Phase 4",
      title: "Advanced Features",
      status: "in-progress",
      items: [
        "🔄 Semantic data integration",
        "🔄 Advanced NFT filtering",
        "⏳ Multi-chain support",
        "⏳ Social features & communities"
      ]
    }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            ✨ Về HairStyleAI Web3
          </h1>
          <p className="hero-subtitle">
            Nền tảng tiên phong kết hợp AI và Blockchain cho việc thử kiểu tóc ảo
          </p>
          <div className="hero-description">
            <p>
              <strong>HairStyleAI Web3</strong> là một dự án đột phá, kết hợp công nghệ 
              Artificial Intelligence tiên tiến với Blockchain để tạo ra trải nghiệm 
              thử kiểu tóc ảo hoàn toàn mới. Người dùng không chỉ có thể thử nghiệm 
              các kiểu tóc khác nhau mà còn có thể sở hữu chúng dưới dạng NFT độc quyền.
            </p>
          </div>
        </div>
        {/* <div className="hero-stats">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div> */}
      </section>

      {/* Mission & Vision */}
      <section className="mission-section">
        <div className="section-content">
          <div className="mission-vision">
            <div className="mission-card">
              <h2>🎯 Sứ mệnh</h2>
              <p>
                Đem đến cho mọi người khả năng thử nghiệm và sở hữu những kiểu tóc 
                độc đáo thông qua công nghệ AI và Blockchain, tạo ra một marketplace 
                NFT đầy sáng tạo cho cộng đồng yêu thích làm đẹp.
              </p>
            </div>
            <div className="vision-card">
              <h2>🔮 Tầm nhìn</h2>
              <p>
                Trở thành nền tảng hàng đầu thế giới trong việc kết hợp AI styling 
                với Web3, nơi mọi người có thể khám phá, sáng tạo và giao dịch 
                những tác phẩm nghệ thuật số về kiểu tóc.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-content">
          <h2 className="section-title">🌟 Tính năng nổi bật</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      {/* <section className="technology-section">
        <div className="section-content">
          <h2 className="section-title">⚙️ Công nghệ sử dụng</h2>
          <div className="tech-categories">
            {technologies.map((category, index) => (
              <div key={index} className="tech-category">
                <h3 className="category-title">{category.category}</h3>
                <div className="tech-items">
                  {category.items.map((tech, techIndex) => (
                    <div key={techIndex} className="tech-item">
                      <h4 className="tech-name">{tech.name}</h4>
                      <p className="tech-description">{tech.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Roadmap */}
      {/* <section className="roadmap-section">
        <div className="section-content">
          <h2 className="section-title">🛣️ Lộ trình phát triển</h2>
          <div className="roadmap-timeline">
            {roadmap.map((phase, index) => (
              <div key={index} className={`roadmap-item ${phase.status}`}>
                <div className="roadmap-marker">
                  <div className="marker-dot"></div>
                </div>
                <div className="roadmap-content">
                  <div className="phase-header">
                    <h3 className="phase-title">{phase.phase}: {phase.title}</h3>
                    <span className={`phase-status ${phase.status}`}>
                      {phase.status === 'completed' ? '✅ Hoàn thành' : 
                       phase.status === 'in-progress' ? '🔄 Đang thực hiện' : '⏳ Sắp tới'}
                    </span>
                  </div>
                  <ul className="phase-items">
                    {phase.items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Team Section */}
      {/* <section className="team-section">
        <div className="section-content">
          <h2 className="section-title">👥 Đội ngũ phát triển</h2>
          <div className="team-grid">
            {teamMembers.map((member) => (
              <div key={member.id} className="team-card">
                <div className="member-avatar">
                  <img src={member.avatar} alt={member.name} />
                </div>
                <div className="member-info">
                  <h3 className="member-name">{member.name}</h3>
                  <p className="member-role">{member.role}</p>
                  <p className="member-description">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Architecture Overview */}
      <section className="architecture-section">
        <div className="section-content">
          <h2 className="section-title">Kiến trúc hệ thống</h2>
          <div className="architecture-diagram">
            <div className="arch-layer frontend-layer">
              <h3>Frontend (React)</h3>
              <div className="layer-items">
                <span>• Upload & Preview</span>
                <span>• Web3 Integration</span>
                <span>• NFT Marketplace</span>
                <span>• Responsive UI</span>
              </div>
            </div>
            <div className="arch-layer backend-layer">
              <h3>Backend (Node.js)</h3>
              <div className="layer-items">
                <span>• AI Processing API</span>
                <span>• Image Upload Handler</span>
                <span>• Chatbot Integration</span>
                <span>• IPFS Storage</span>
              </div>
            </div>
            <div className="arch-layer blockchain-layer">
              <h3>Blockchain (Ethereum)</h3>
              <div className="layer-items">
                <span>• ERC-721 NFT Contract</span>
                <span>• Marketplace Contract</span>
                <span>• MetaMask Integration</span>
                <span>• Decentralized Storage</span>
              </div>
            </div>
            <div className="arch-layer ai-layer">
              <h3>AI Engine (Python)</h3>
              <div className="layer-items">
                <span>• HairFastGAN Model</span>
                <span>• Image Processing</span>
                <span>• Style Transfer</span>
                <span>• Real-time Generation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Social */}
      <section className="contact-section">
        <div className="section-content">
          {/* <h2 className="section-title">Liên hệ & Cộng đồng</h2> */}
          <div className="contact-info">
            <div className="contact-card">
              <h3>Thông tin liên hệ</h3>
              <div className="contact-details">
                <p>Email: info@hairstyleai.web3</p>
                <p>Hotline: +84 123 456 789</p>
                <p>Địa chỉ: 123 Blockchain Street, Web3 City</p>
                <p>Website: https://hairstyleai.web3</p>
              </div>
            </div>
            <div className="social-card">
              <h3>🌍 Tham gia cộng đồng</h3>
              <div className="social-links">
                <a href="#" className="social-link">Facebook</a>
                <a href="#" className="social-link">Instagram</a>
                <a href="#" className="social-link">Twitter</a>
                <a href="#" className="social-link">Discord</a>
                <a href="#" className="social-link">YouTube</a>
                <a href="#" className="social-link">LinkedIn</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="cta-section">
        <div className="section-content">
          <div className="cta-content">
            <h2>🚀 Sẵn sàng khám phá?</h2>
            <p>Tham gia cùng chúng tôi trong cuộc cách mạng AI + Web3!</p>
            <div className="cta-buttons">
              <button 
                className="cta-button primary"
                onClick={() => window.location.href = '/home'}
              >
                🎨 Thử ngay miễn phí
              </button>
              {/* <button 
                className="cta-button secondary"
                onClick={() => window.location.href = '/#marketplace'}
              >
                🏪 Khám phá Marketplace
              </button> */}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;