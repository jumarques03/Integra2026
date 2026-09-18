import "./Logo.css";

export default function Logo({ code = "01001010" }) {
  return (
    <div className="logo-block">
      <span className="logo-text">AI MISTERY</span>
      {code && <span className="logo-code mono">{code}</span>}
    </div>
  );
}
