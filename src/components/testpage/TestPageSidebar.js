"use client";

import TestGuidelines from "./TestGuidelines";
import UserTestStats from "./UserTestStats";
import WhyTakeTests from "./WhyTakeTests";

export default function TestPageSidebar({ examType }) {
  return (
    <div className="flex flex-col gap-4">
      <UserTestStats examType={examType} />
      <WhyTakeTests examType={examType} />
      <TestGuidelines />
    </div>
  );
}
