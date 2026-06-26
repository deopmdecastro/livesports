"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import type { Competition } from "@/types";
import { getCompetitionHero } from "@/lib/competition-public";
import { competitionThemeStyle, getCompetitionTheme } from "@/lib/competition-theme";

interface WorldCupHeroProps {
  competition: Competition;
}

export default function WorldCupHero({ competition }: WorldCupHeroProps) {
  const hero = getCompetitionHero(competition);
  const theme = getCompetitionTheme(competition);
  const hasBanner = Boolean(competition.banner);
  const hasThumbnail = Boolean(competition.thumbnail);

  return (
    <section className="relative overflow-hidden py-16 lg:py-24" style={competitionThemeStyle(competition)}>
      {hasBanner ? (
        <>
          <img
            src={competition.banner}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, rgba(6,6,9,0.55) 0%, rgba(6,6,9,0.82) 55%, #060609 100%)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${theme.softBg} 0%, transparent 50%)` }}
          />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#060609] via-[#0A0A10] to-[#060609]" />
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div
            className="absolute top-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full blur-[100px]"
            style={{ background: theme.glow }}
          />
        </>
      )}

      <div className="relative mx-auto max-w-[1400px] px-4 text-center lg:px-6">
        {hasThumbnail ? (
          <div className="mb-6 flex justify-center">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-2xl border p-3 backdrop-blur-sm lg:h-28 lg:w-28"
              style={{ borderColor: theme.border, background: theme.badgeBg }}
            >
              <img
                src={competition.thumbnail}
                alt={competition.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        ) : (
          <div
            className="mb-6 inline-flex items-center justify-center gap-3 rounded-full border px-5 py-2.5 text-sm font-bold"
            style={{ borderColor: theme.border, background: theme.badgeBg, color: theme.primary }}
          >
            <span className="text-2xl">{hero.badgeIcon}</span>
            {hero.badge}
          </div>
        )}

        {hasThumbnail && hero.badge ? (
          <p className="mb-4 text-sm font-bold uppercase tracking-widest" style={{ color: theme.primary }}>
            {hero.badge}
          </p>
        ) : null}

        <h1
          className="mb-4 text-4xl font-black leading-tight text-white md:text-6xl lg:text-7xl"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {hero.titleLine1}
          {hero.titleLine2 ? (
            <span className="block" style={{ color: theme.primary }}>
              {hero.titleLine2}
            </span>
          ) : null}
        </h1>

        {hero.description ? (
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300">{hero.description}</p>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          {[
            { value: hero.statTeams, label: "Seleções" },
            { value: hero.statGames, label: "Jogos" },
            { value: hero.statHostCountries, label: "Países Sede" },
            { value: hero.statStadiums, label: "Estádios" },
          ]
            .filter((stat) => stat.value > 0)
            .map((stat, index) => (
              <div key={stat.label} className="flex items-center gap-6">
                {index > 0 ? <div className="h-8 w-px bg-[#1E1E2A]" /> : null}
                <div className="flex flex-col items-center gap-1">
                  <span
                    className="text-3xl font-black text-white"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {stat.value}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-gray-500">{stat.label}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

interface CtaBannerProps extends WorldCupHeroProps {
  competitionSlug?: string;
}

export function WorldCupCtaBanner({ competition, competitionSlug }: CtaBannerProps) {
  const hero = getCompetitionHero(competition);
  const theme = getCompetitionTheme(competition);
  const slug = competitionSlug || competition.slug;

  if (!hero.ctaTitle && !hero.ctaDescription) return null;

  return (
    <div
      className="relative mt-8 overflow-hidden rounded-2xl border bg-gradient-to-r from-[#111118] via-[#0E0E16] to-[#111118]"
      style={{ borderColor: theme.border }}
    >
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(to right, ${theme.softBg}, transparent)` }}
      />
      <div className="relative flex flex-col items-center justify-between gap-4 p-5 sm:flex-row lg:p-6">
        <div className="flex items-center gap-4">
          {competition.thumbnail ? (
            <img src={competition.thumbnail} alt="" className="h-14 w-14 object-contain" />
          ) : (
            <span className="text-5xl">{hero.badgeIcon}</span>
          )}
          <div>
            <p className="text-lg font-black text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {hero.ctaTitle}
            </p>
            {hero.ctaDescription ? <p className="text-sm text-gray-400">{hero.ctaDescription}</p> : null}
          </div>
        </div>
        {hero.ctaButtonText ? (
          <Link
            href={`/competicao/${slug}`}
            className="flex flex-shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm font-black transition-all hover:brightness-110"
            style={{ background: theme.primary, color: theme.onPrimary }}
          >
            <Zap className="h-4 w-4" />
            {hero.ctaButtonText}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
