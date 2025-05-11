import Link from "next/link";
import { EnvVarWarning } from "./env-var-warning";
import HeaderAuth from "./header-auth";

export default function Navbar( { hasEnvVars }: { hasEnvVars: boolean }) {
    return (
        <nav className="w-full bg-gray-900 text-white">
            <div className="w-full max-w-5xl mx-auto flex justify-between items-center p-4 px-6 text-sm">
                <div className="flex gap-6 items-center font-semibold">
                    <Link href="/">
                        <span className="text-white hover:animate-pulse-tech hover:text-tech-blue transition-all duration-300">Mark Cena's portfolio</span>
                    </Link>
                </div> 
                <div className="flex gap-6 items-center font-semibold">
                    <div className="hidden md:flex gap-4">
                        <Link href="/timeline" >
                            <span className="text-white hover:animate-pulse-tech hover:text-tech-blue transition-all duration-300">Timeline</span>
                        </Link>
                        <Link href="/skills" >
                            <span className="text-white hover:animate-pulse-tech hover:text-tech-blue transition-all duration-300">Skills</span>
                        </Link>
                        <Link href="/about">
                            <span className="text-white hover:animate-pulse-tech hover:text-tech-blue transition-all duration-300">About</span>
                        </Link>
                        <Link href="/contact">
                            <span className="text-white hover:animate-pulse-tech hover:text-tech-blue transition-all duration-300">Contact</span>
                        </Link>
                    </div>
                </div>
                <div>{!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}</div>
            </div>

            <div className="md:hidden flex justify-center gap-4 p-2 border-t border-gray-700">
                <Link href="/timeline">
                    <span className="text-white hover:animate-pulse-tech hover:text-tech-blue transition-all duration-300">Timeline</span>
                </Link>
                <Link href="/skills">
                    <span className="text-white hover:animate-pulse-tech hover:text-tech-blue transition-all duration-300">Skills</span>
                </Link>
                <Link href="/about">
                    <span className="text-white hover:animate-pulse-tech hover:text-tech-blue transition-all duration-300">About</span>
                </Link>
                <Link href="/contact">
                    <span className="text-white hover:animate-pulse-tech hover:text-tech-blue transition-all duration-300">Contact</span>
                </Link>
            </div>
        </nav>
    );
}
