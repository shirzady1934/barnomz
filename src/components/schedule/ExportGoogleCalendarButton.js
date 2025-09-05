import { useAtomValue } from "jotai";
import { currentScheduleIdAtom, schedulesAtom } from "@/atoms";
import { useToast } from "@/components/dls/toast/ToastService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarPlus } from "@fortawesome/free-solid-svg-icons";
import moment from "moment-jalaali";

const weekdayTokens = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

const ExportGoogleCalendarButton = () => {
  const toast = useToast();
  const schedules = useAtomValue(schedulesAtom);
  const currentScheduleId = useAtomValue(currentScheduleIdAtom);

  const pad = (n) => String(n).padStart(2, "0");
  const formatDate = (d) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(
      d.getHours(),
    )}${pad(d.getMinutes())}00`;

  const getNextDate = (day) => {
    const date = new Date();
    const diff = (day + 7 - date.getDay()) % 7;
    date.setDate(date.getDate() + diff);
    return date;
  };

  const downloadICS = (content, filename) => {
    try {
      const blob = new Blob([content], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.open({ message: "خروجی با موفقیت ذخیره شد.", type: "success" });
    } catch (e) {
      console.error(e);
      toast.open({ message: "خطا در ساخت فایل خروجی.", type: "error" });
    }
  };

  const exportCalendar = () => {
    const schedule = schedules.find((s) => s.id === currentScheduleId);
    if (!schedule) return;

    const events = [];
    schedule.courses.forEach((course) => {
      course.sessions.forEach((session) => {
        const next = getNextDate(session.dayOfWeek);
        const [sh, sm] = session.startTime.split(":").map((n) => parseInt(n, 10));
        const [eh, em] = session.endTime.split(":").map((n) => parseInt(n, 10));
        const start = new Date(next);
        start.setHours(sh, sm, 0, 0);
        const end = new Date(next);
        end.setHours(eh, em, 0, 0);
        events.push(
          [
            "BEGIN:VEVENT",
            `SUMMARY:${course.courseName}`,
            `DTSTART;TZID=Asia/Tehran:${formatDate(start)}`,
            `DTEND;TZID=Asia/Tehran:${formatDate(end)}`,
            `RRULE:FREQ=WEEKLY;BYDAY=${weekdayTokens[session.dayOfWeek]}`,
            "END:VEVENT",
          ].join("\r\n"),
        );
      });
      if (course.finalExamDate && course.finalExamTime) {
        const m = moment(
          `${course.finalExamDate} ${course.finalExamTime}`,
          "jYYYY/jMM/jDD HH:mm",
        );
        const start = m.toDate();
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
        events.push(
          [
            "BEGIN:VEVENT",
            `SUMMARY:امتحان ${course.courseName}`,
            `DTSTART;TZID=Asia/Tehran:${formatDate(start)}`,
            `DTEND;TZID=Asia/Tehran:${formatDate(end)}`,
            "END:VEVENT",
          ].join("\r\n"),
        );
      }
    });

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n");

    downloadICS(icsContent, `schedule-${Date.now()}.ics`);
  };

  return (
    <div className="group relative">
      <button
        className="z-50 flex items-center justify-center rounded-full bg-secondary p-3 text-black shadow-lg transition-all duration-300 hover:opacity-85"
        onClick={exportCalendar}
        aria-label="export-calendar"
      >
        <FontAwesomeIcon icon={faCalendarPlus} />
      </button>
      <span className="fixed bottom-14 left-[10px] z-50 mb-2 w-max rounded bg-black p-2 text-xs text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        خروجی گوگل کلندر (ICS)
      </span>
    </div>
  );
};

export default ExportGoogleCalendarButton;

