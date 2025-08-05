// components/sections/about.section.tsx
"use client";

import React from "react";
import { Text } from "@/components/ui/text";
import { Globe, Shield, Coins, Users, Zap, TrendingUp } from "lucide-react";
import { useNetworkStats } from "@/lib/hooks/useNetworkStats"; // CHANGES: Added network stats hook
import { useAccount } from "wagmi";

export const AboutSection = () => {
  // CHANGES: Get real network statistics
  const { totalDomains, totalSubdomains, networkUptime, loading } =
    useNetworkStats();
  const { isConnected } = useAccount();

  const features = [
    {
      icon: Globe,
      title: "Decentralized Domains",
      description:
        "Own your digital identity with .atgraphite domains. True ownership means no central authority can take away your domain or restrict your usage.",
      highlight: "True Digital Ownership",
    },
    {
      icon: Shield,
      title: "Trust & Security",
      description:
        "Built on Graphite Network's robust infrastructure with advanced trust scoring mechanisms that ensure transparent and secure interactions while preserving privacy.",
      highlight: "Enterprise-Grade Security",
    },
    {
      icon: Coins,
      title: "Monetize Your Domains",
      description:
        "Domain owners can create and sell subdomains, generating ongoing revenue streams. Set your own prices and build a sustainable digital asset portfolio.",
      highlight: "Revenue Generation",
    },
    {
      icon: Users,
      title: "Community Driven",
      description:
        "Graphite Names is built for the community, by the community. Participate in governance, contribute to development, and help shape the future of decentralized naming.",
      highlight: "Open Ecosystem",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Experience instant domain registration and management with Graphite Network's high-performance blockchain infrastructure designed for speed and efficiency.",
      highlight: "Optimized Performance",
    },
    {
      icon: TrendingUp,
      title: "Growing Network",
      description:
        "Join a rapidly expanding ecosystem where entry-point nodes earn from network participation, creating sustainable revenue streams for infrastructure supporters.",
      highlight: "Network Effects",
    },
  ];

  // CHANGES: Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k+`;
    } else if (num === 0) {
      return `${num}`;
    }
    return `${num}+`;
  };

  return (
    <section className="py-20 px-4 md:px-20" id="about">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Text className="text-4xl md:text-5xl font-bold mb-6">
            About Graphite Names
          </Text>
          <Text className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            The next-generation decentralized naming service built on Graphite
            Network. Own, manage, and monetize your digital identity with true
            decentralization.
          </Text>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group"
            >
              {/* Icon */}
              <div className="bg-primary/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/30 transition-colors">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>

              {/* Content */}
              <div className="mb-4">
                <Text className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </Text>
                <Text className="text-white/60 text-sm bg-primary/10 px-3 py-1 rounded-full inline-block mb-4">
                  {feature.highlight}
                </Text>
              </div>

              <Text className="text-white/70 leading-relaxed">
                {feature.description}
              </Text>
            </div>
          ))}
        </div>

        {/* Bottom CTA Section with Real Stats */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-3xl p-8 md:p-12 text-center">
          <Text className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Own Your Digital Identity?
          </Text>
          <Text className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of users who have already secured their .atgraphite
            domains. Start building your decentralized digital presence today.
          </Text>

          {isConnected && (
            <>
              {/* CHANGES: Real-time statistics from blockchain */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="bg-white/5 px-6 py-3 rounded-xl border border-white/10 min-w-[140px] mobile:w-full">
                  {loading ? (
                    <div className="animate-pulse ">
                      <div className="h-6 bg-white/20 rounded mb-1"></div>
                      <div className="h-4 bg-white/10 rounded"></div>
                    </div>
                  ) : (
                    <>
                      <Text className="text-primary font-semibold text-lg">
                        {formatNumber(totalDomains)}
                      </Text>
                      <Text className="text-white/60 text-sm">
                        Domains Registered
                      </Text>
                    </>
                  )}
                </div>

                <div className="bg-white/5 px-6 py-3 rounded-xl border border-white/10 min-w-[140px] mobile:w-full">
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-6 bg-white/20 rounded mb-1"></div>
                      <div className="h-4 bg-white/10 rounded"></div>
                    </div>
                  ) : (
                    <>
                      <Text className="text-primary font-semibold text-lg">
                        {formatNumber(totalSubdomains)}
                      </Text>
                      <Text className="text-white/60 text-sm">
                        Active Subdomains
                      </Text>
                    </>
                  )}
                </div>

                <div className="bg-white/5 px-6 py-3 rounded-xl border border-white/10 min-w-[140px] mobile:w-full">
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-6 bg-white/20 rounded mb-1"></div>
                      <div className="h-4 bg-white/10 rounded"></div>
                    </div>
                  ) : (
                    <>
                      <Text className="text-primary font-semibold text-lg">
                        {networkUptime}
                      </Text>
                      <Text className="text-white/60 text-sm">
                        Network Uptime
                      </Text>
                    </>
                  )}
                </div>
              </div>

              {/* CHANGES: Added update indicator */}
              {!loading && (
                <Text className="text-white/40 text-xs mt-4">
                  Live data from Graphite Network • Updates every 30 seconds
                </Text>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
