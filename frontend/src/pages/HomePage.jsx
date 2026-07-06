import Hero from "../components/sections/Hero"
import Slider from "../components/sections/Slider"
import Spaces from "../components/sections/Spaces"
import AboutSetup from "../components/sections/AboutSetup"
import OurProcess from "../components/sections/OurProcess"
import PlansAndContact from "../components/sections/PlansAndContact"
import CtaBanner from "../components/sections/CtaBanner"

export default function HomePage() {
  return (
    <>
      <Hero />
      <Slider />
      <Spaces />
      <AboutSetup />
      <OurProcess />
      <CtaBanner />
      <PlansAndContact />
    </>
  )
}
