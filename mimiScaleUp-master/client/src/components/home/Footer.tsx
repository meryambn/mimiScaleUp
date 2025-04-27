import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer id="contact" style={{
      backgroundColor: '#57193c',
      padding: '2rem',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        display: 'flex',
        gap: '2rem',
        marginBottom: '1rem'
      }}>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          style={{
            color: 'white',
            fontSize: '1.8rem',
            transition: 'transform 0.3s ease'
          }}
        >
          <i className="fab fa-instagram"></i>
        </a>
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          style={{
            color: 'white',
            fontSize: '1.8rem',
            transition: 'transform 0.3s ease'
          }}
        >
          <i className="fab fa-facebook"></i>
        </a>
        <a
          href="https://wa.me/+213"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          style={{
            color: 'white',
            fontSize: '1.8rem',
            transition: 'transform 0.3s ease'
          }}
        >
          <i className="fab fa-whatsapp"></i>
        </a>
      </div>

      <p style={{
        color: 'white',
        marginTop: '0.5rem',
        fontSize: '0.9rem'
      }}>
        © ScaleUp. droits réservés.
      </p>
    </footer>
  );
};

export default Footer;
