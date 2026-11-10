import { Button, Field, PhoneInput, Status } from "@harmo-ui/react";
import * as libphonenumber from "libphonenumber-js";
import mobileExamples from "libphonenumber-js/examples.mobile.json";
import { useState } from "react";

export const examples = {
  Default: () => (
    <Field label="Phone">
      <PhoneInput
        phone={libphonenumber}
        locale="en"
        defaultCountry="US"
        countries={["AZ", "DE", "FR", "GB", "TR", "US"]}
        countryLabel="Country code"
        searchLabel="Search countries"
        emptyMessage="No countries found"
      />
    </Field>
  ),
  "With a number already": () => (
    <Field label="Phone">
      <PhoneInput
        phone={libphonenumber}
        locale="en"
        defaultCountry="US"
        defaultValue="+994501234567"
        countries={["AZ", "DE", "FR", "GB", "TR", "US"]}
        countryLabel="Country code"
        searchLabel="Search countries"
        emptyMessage="No countries found"
      />
    </Field>
  ),
  "Checking the number": () => {
    const [number, setNumber] = useState("");
    const [valid, setValid] = useState(false);

    return (
      <>
        <Field label="Phone">
          <PhoneInput
            phone={libphonenumber}
            locale="en"
            defaultCountry="US"
            countries={["AZ", "DE", "FR", "GB", "TR", "US"]}
            countryLabel="Country code"
            searchLabel="Search countries"
            emptyMessage="No countries found"
            onValueChange={(value, details) => {
              setNumber(value);
              setValid(details.valid);
            }}
          />
        </Field>
        <Status status={valid ? "success" : undefined}>{valid ? number : "Not a complete number yet"}</Status>
      </>
    );
  },
  "An example as the placeholder": () => (
    <Field label="Phone">
      <PhoneInput
        phone={libphonenumber}
        examples={mobileExamples}
        locale="en"
        defaultCountry="US"
        countries={["AZ", "DE", "FR", "GB", "TR", "US"]}
        countryLabel="Country code"
        searchLabel="Search countries"
        emptyMessage="No countries found"
      />
    </Field>
  ),
  "Your own flags": () => (
    <Field label="Phone">
      <PhoneInput
        phone={libphonenumber}
        locale="en"
        defaultCountry="US"
        countries={["AZ", "DE", "FR", "GB", "TR", "US"]}
        countryLabel="Country code"
        searchLabel="Search countries"
        emptyMessage="No countries found"
        renderFlag={(country) => (
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1 }}>{country}</span>
        )}
      />
    </Field>
  ),
  "Right to left": () => (
    <div dir="rtl" lang="ar" style={{ inlineSize: "100%" }}>
      <Field label="الهاتف">
        <PhoneInput
          phone={libphonenumber}
          locale="ar"
          defaultCountry="AZ"
          countries={["AZ", "DE", "FR", "GB", "TR", "US"]}
          countryLabel="رمز البلد"
          searchLabel="ابحث عن بلد"
          emptyMessage="لا توجد بلدان"
        />
      </Field>
    </div>
  ),
  Disabled: () => (
    <Field label="Phone">
      <PhoneInput
        phone={libphonenumber}
        locale="en"
        defaultCountry="US"
        defaultValue="+14155552671"
        disabled
        countries={["AZ", "DE", "FR", "GB", "TR", "US"]}
        countryLabel="Country code"
        searchLabel="Search countries"
        emptyMessage="No countries found"
      />
    </Field>
  ),
  "In a form": () => (
    <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field label="Phone">
        <PhoneInput
          name="phone"
          phone={libphonenumber}
          locale="en"
          defaultCountry="US"
          defaultValue="+14155552671"
          countries={["AZ", "DE", "FR", "GB", "TR", "US"]}
          countryLabel="Country code"
          searchLabel="Search countries"
          emptyMessage="No countries found"
        />
      </Field>
      <Button variant="secondary" type="reset" style={{ alignSelf: "flex-start" }}>
        Reset
      </Button>
    </form>
  ),
};
