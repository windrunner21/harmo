import { DateFilter, type DateFilterValue } from "@harmo-ui/react";
import { useState } from "react";

export const examples = {
  Default: () => (
    <DateFilter
      label="Due date"
      locale="en-US"
      today="2026-11-09"
      labels={{
        conditions: {
          last: "is in the last",
          equal: "is equal to",
          between: "is between",
          after: "is after",
          before: "is before",
        },
        units: { minutes: "minutes", hours: "hours", days: "days", weeks: "weeks", months: "months" },
        condition: "Condition",
        amount: "How many",
        unit: "Unit",
        date: "Date",
        startDate: "Start date",
        endDate: "End date",
        and: "and",
        datePlaceholder: "mm/dd/yyyy",
        calendar: "Choose a date",
        previousMonth: "Previous month",
        nextMonth: "Next month",
        apply: "Apply",
        clear: "Clear",
      }}
    />
  ),

  "Kept in the URL": () => {
    // Your router reads and writes these; here they're only state.
    const [value, setValue] = useState<DateFilterValue>({ gte: 1793491200, lte: 1794268799 });
    const query = [
      value.gte !== null && `due[gte]=${value.gte}`,
      value.lte !== null && `due[lte]=${value.lte}`,
    ]
      .filter(Boolean)
      .join("&");

    return (
      <div style={{ display: "grid", gap: 12, justifyItems: "start", maxWidth: "100%" }}>
        <DateFilter
          label="Due date"
          locale="en-US"
          today="2026-11-09"
          value={value}
          onValueChange={setValue}
          labels={{
            conditions: {
              last: "is in the last",
              equal: "is equal to",
              between: "is between",
              after: "is after",
              before: "is before",
            },
            units: { minutes: "minutes", hours: "hours", days: "days", weeks: "weeks", months: "months" },
            condition: "Condition",
            amount: "How many",
            unit: "Unit",
            date: "Date",
            startDate: "Start date",
            endDate: "End date",
            and: "and",
            datePlaceholder: "mm/dd/yyyy",
            calendar: "Choose a date",
            previousMonth: "Previous month",
            nextMonth: "Next month",
            apply: "Apply",
            clear: "Clear",
          }}
        />
        <code data-example-query="" style={{ overflowWrap: "anywhere" }}>
          ?{query}
        </code>
      </div>
    );
  },

  "Right to left": () => (
    <DateFilter
      label="تاريخ الاستحقاق"
      locale="ar-EG"
      today="2026-11-09"
      labels={{
        conditions: {
          last: "خلال آخر",
          equal: "يساوي",
          between: "بين",
          after: "بعد",
          before: "قبل",
        },
        units: { minutes: "دقائق", hours: "ساعات", days: "أيام", weeks: "أسابيع", months: "أشهر" },
        condition: "الشرط",
        amount: "العدد",
        unit: "الوحدة",
        date: "التاريخ",
        startDate: "تاريخ البداية",
        endDate: "تاريخ النهاية",
        and: "و",
        calendar: "اختر تاريخًا",
        previousMonth: "الشهر السابق",
        nextMonth: "الشهر التالي",
        apply: "تطبيق",
        clear: "مسح",
      }}
    />
  ),
};
