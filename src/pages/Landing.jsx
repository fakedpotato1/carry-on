import { ArrowRight, Play, Waves } from 'lucide-react'
import { Link } from 'react-router-dom'
import GradientWaves from '../components/GradientWaves'

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-bg" aria-hidden="true">
        <GradientWaves
          horizonColor="#33b260"
          waveColor="#c7dcbf"
          crestColor="#f1f3ec"
          speed={0.6}
          amplitude={2.6}
          waveScale={0.6}
          waveRatio={0.9}
          swell={26.5}
          turbulence={6.5}
          tilt={0.2}
          zoom={0.9}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={1.0}
          opacity={1.0}
          mouseInteraction={false}
          parallaxStrength={0.5}
          grain
          grainIntensity={0.05}
        />
      </div>

      <div className="landing-content">
        <header className="landing-nav">
          <Link to="/" className="landing-brand">
            <span className="landing-brand-mark"><Waves size={26} aria-hidden="true" /></span>
            <span className="landing-brand-name">Load Shift</span>
          </Link>

          <div className="landing-nav-actions">
            <Link to="/dashboard" className="landing-btn landing-btn-ghost">Log In</Link>
            <Link to="/signup" className="landing-btn landing-btn-solid">Sign Up</Link>
          </div>
        </header>

        <main className="landing-hero">
          <span className="landing-badge"><span className="landing-badge-new">NEW</span>Smarter tools for student teams</span>

          <h1 className="landing-headline">
            Less chaos,
            <svg className="landing-spark" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
              <path d="M5 19 L10 10" stroke="#f4e2a1" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M12 15 L18 5" stroke="#f4e2a1" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M18 19 L25 13" stroke="#f4e2a1" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            more progress
          </h1>

          <p className="landing-subtext">Plan, track, and manage your group projects in one place so you can focus on what really matters.</p>

          <div className="landing-cta-row">
            <Link to="/signup" className="landing-cta-primary">
              Get started
              <span className="landing-cta-arrow"><ArrowRight size={17} aria-hidden="true" /></span>
            </Link>
            <button type="button" className="landing-cta-secondary">
              <span className="landing-cta-play"><Play size={13} aria-hidden="true" fill="currentColor" /></span>
              Watch demo
            </button>
          </div>
        </main>

        <span className="landing-scribble" aria-hidden="true">
          Smaller steps,<br />brighter futures ♡
          <svg className="landing-scribble-swash" width="118" height="20" viewBox="0 0 118 20" fill="none">
            <path d="M2 4 C 30 2, 60 18, 116 12" stroke="#f2eecf" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </svg>
        </span>
      </div>
    </div>
  )
}
