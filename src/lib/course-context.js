"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { useAuth } from "./auth-context";

const CourseContext = createContext(null);

export function CourseProvider({ children }) {
  const { user, refresh } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const loadEnrollments = useCallback(() => {
    if (!user) {
      setEnrollments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get("/enrollments/mine/")
      .then((data) => setEnrollments(Array.isArray(data) ? data : []))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const activeCourse = user?.active_course_detail || null;

  // Right after login, `user` comes from the /auth/login/ response, which never
  // ran MeView's "auto-pick first enrollment" logic — only /auth/me/ does. Nudge
  // it once so a fresh session still lands on a sensible default course.
  useEffect(() => {
    if (user && !user.active_course_detail && !user.is_staff) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const otherCourses = useMemo(
    () => enrollments.filter((e) => e.course !== activeCourse?.id),
    [enrollments, activeCourse]
  );

  const switchCourse = useCallback(
    async (courseId) => {
      if (!courseId || courseId === activeCourse?.id) return;
      setSwitching(true);
      try {
        await api.post("/auth/active-course/", { course_id: courseId });
        await refresh();
      } finally {
        setSwitching(false);
      }
    },
    [activeCourse, refresh]
  );

  const value = useMemo(
    () => ({ enrollments, otherCourses, activeCourse, switchCourse, loading, switching }),
    [enrollments, otherCourses, activeCourse, switchCourse, loading, switching]
  );

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourse() {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error("useCourse must be used within CourseProvider");
  return ctx;
}
