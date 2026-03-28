import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} Michał Rusek
      </p>
    </footer>
  );
};

export default Footer;