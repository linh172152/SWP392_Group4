import { useState } from 'react';
import './UserComponents.css';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}


export default function SupportSection() {
  const [activeSection, setActiveSection] = useState<'tickets' | 'rating' | 'faq'>('tickets');
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });
  const [newRating, setNewRating] = useState({
    stationId: '',
    rating: 5,
    comment: ''
  });

  // Mock data
  const tickets: SupportTicket[] = [
    {
      id: '1',
      title: 'Pin không sạc được',
      description: 'Pin xe không sạc được sau khi đổi tại trạm',
      status: 'resolved',
      priority: 'high',
      createdAt: '2024-12-10',
      updatedAt: '2024-12-12'
    },
    {
      id: '2',
      title: 'Trạm đổi pin bị lỗi',
      description: 'Trạm đổi pin tại Quận 1 không hoạt động',
      status: 'in-progress',
      priority: 'medium',
      createdAt: '2024-12-14',
      updatedAt: '2024-12-15'
    }
  ];

  const stations = [
    { id: '1', name: 'Trạm đổi pin Quận 1' },
    { id: '2', name: 'Trạm đổi pin Quận 2' },
    { id: '3', name: 'Trạm đổi pin Quận 3' }
  ];

  const faqs = [
    {
      question: 'Làm thế nào để đổi pin?',
      answer: 'Bạn có thể đặt lịch trước hoặc đến trực tiếp trạm đổi pin. Quá trình đổi pin mất khoảng 3-5 phút.'
    },
    {
      question: 'Chi phí đổi pin là bao nhiêu?',
      answer: 'Chi phí đổi pin theo lượt là 150,000 VNĐ/lần. Nếu đăng ký gói dịch vụ sẽ có giá ưu đãi.'
    },
    {
      question: 'Pin có bảo hành không?',
      answer: 'Tất cả pin đều được bảo hành 12 tháng. Nếu có lỗi, bạn có thể liên hệ hỗ trợ để được thay thế miễn phí.'
    },
    {
      question: 'Làm sao để hủy đặt lịch?',
      answer: 'Bạn có thể hủy đặt lịch trước 2 giờ thông qua ứng dụng hoặc gọi hotline 1900-xxxx.'
    }
  ];

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Yêu cầu hỗ trợ đã được gửi! Chúng tôi sẽ liên hệ lại trong vòng 24h.');
    setNewTicket({ title: '', description: '', priority: 'medium' });
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Đánh giá đã được gửi! Cảm ơn bạn đã phản hồi.');
    setNewRating({ stationId: '', rating: 5, comment: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#3B82F6';
      case 'in-progress': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'closed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Mới';
      case 'in-progress': return 'Đang xử lý';
      case 'resolved': return 'Đã giải quyết';
      case 'closed': return 'Đã đóng';
      default: return 'Không xác định';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div className="user-component">
      <div className="component-header">
        <h2 className="component-title">Hỗ trợ & Phản hồi</h2>
        <p className="component-subtitle">Gửi yêu cầu hỗ trợ và đánh giá dịch vụ</p>
      </div>

      <div className="component-nav">
        <button 
          className={`nav-btn ${activeSection === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveSection('tickets')}
        >
          Yêu cầu hỗ trợ
        </button>
        <button 
          className={`nav-btn ${activeSection === 'rating' ? 'active' : ''}`}
          onClick={() => setActiveSection('rating')}
        >
          Đánh giá dịch vụ
        </button>
        <button 
          className={`nav-btn ${activeSection === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveSection('faq')}
        >
          Câu hỏi thường gặp
        </button>
      </div>

      <div className="component-content">
        {activeSection === 'tickets' && (
          <div className="tickets-section">
            <div className="tickets-header">
              <h3>Yêu cầu hỗ trợ</h3>
              <button className="new-ticket-btn">Tạo yêu cầu mới</button>
            </div>

            <form onSubmit={handleSubmitTicket} className="ticket-form">
              <div className="form-group">
                <label htmlFor="title">Tiêu đề</label>
                <input
                  type="text"
                  id="title"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                  placeholder="Mô tả ngắn gọn vấn đề"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Mô tả chi tiết</label>
                <textarea
                  id="description"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                  rows={4}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="priority">Mức độ ưu tiên</label>
                <select
                  id="priority"
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({...newTicket, priority: e.target.value as 'low' | 'medium' | 'high'})}
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                </select>
              </div>
              <button type="submit" className="submit-btn">Gửi yêu cầu</button>
            </form>

            <div className="tickets-list">
              <h4>Yêu cầu của bạn</h4>
              {tickets.map((ticket) => (
                <div key={ticket.id} className="ticket-item">
                  <div className="ticket-header">
                    <h5>{ticket.title}</h5>
                    <div className="ticket-meta">
                      <span 
                        className="ticket-status"
                        style={{ color: getStatusColor(ticket.status) }}
                      >
                        {getStatusText(ticket.status)}
                      </span>
                      <span 
                        className="ticket-priority"
                        style={{ color: getPriorityColor(ticket.priority) }}
                      >
                        {ticket.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="ticket-description">{ticket.description}</p>
                  <div className="ticket-footer">
                    <span className="ticket-date">Tạo: {ticket.createdAt}</span>
                    <span className="ticket-date">Cập nhật: {ticket.updatedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'rating' && (
          <div className="rating-section">
            <h3>Đánh giá dịch vụ</h3>
            <form onSubmit={handleSubmitRating} className="rating-form">
              <div className="form-group">
                <label htmlFor="station">Chọn trạm đổi pin</label>
                <select
                  id="station"
                  value={newRating.stationId}
                  onChange={(e) => setNewRating({...newRating, stationId: e.target.value})}
                  required
                >
                  <option value="">Chọn trạm</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Đánh giá (1-5 sao)</label>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star ${star <= newRating.rating ? 'active' : ''}`}
                      onClick={() => setNewRating({...newRating, rating: star})}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="comment">Nhận xét</label>
                <textarea
                  id="comment"
                  value={newRating.comment}
                  onChange={(e) => setNewRating({...newRating, comment: e.target.value})}
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                  rows={3}
                />
              </div>
              <button type="submit" className="submit-btn">Gửi đánh giá</button>
            </form>
          </div>
        )}

        {activeSection === 'faq' && (
          <div className="faq-section">
            <h3>Câu hỏi thường gặp</h3>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className="faq-item">
                  <h4 className="faq-question">{faq.question}</h4>
                  <p className="faq-answer">{faq.answer}</p>
                </div>
              ))}
            </div>
            <div className="contact-info">
              <h4>Liên hệ hỗ trợ</h4>
              <div className="contact-methods">
                <div className="contact-item">
                  <span className="contact-label">Hotline:</span>
                  <span className="contact-value">1900-xxxx</span>
                </div>
                <div className="contact-item">
                  <span className="contact-label">Email:</span>
                  <span className="contact-value">support@evbattery.com</span>
                </div>
                <div className="contact-item">
                  <span className="contact-label">Thời gian hỗ trợ:</span>
                  <span className="contact-value">24/7</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
