import { Card } from "@provider-stubs/shared";

function Field({ name, value }: { name: string; value: string }) {
  return (
    <label>
      {name}
      <input name={name} value={value} required />
    </label>
  );
}

/** A form per provider, filled with a sample message, posting to `/send/<provider>`. */
export function SendForms() {
  return (
    <div class="grid">
      <Card title="POST /send/sms">
        <form class="send-form" method="post" action="/send/sms">
          <Field name="to" value="+15550100" />
          <Field name="body" value="Your acme code is 123456" />
          <button class="dl-button">Send SMS</button>
        </form>
      </Card>
      <Card title="POST /send/email">
        <form class="send-form" method="post" action="/send/email">
          <Field name="to" value="ada@example.invalid" />
          <Field name="subject" value="Welcome to acme" />
          <Field name="text" value="Thanks for signing up." />
          <button class="dl-button">Send email</button>
        </form>
      </Card>
    </div>
  );
}
