import type { FinishedJob } from "@queue-workers/queue";

const time = (ms: number) => new Date(ms).toLocaleTimeString("en-GB");

/** The newest finished jobs: which worker took each one and how long it took. */
export function FinishedTable({ jobs }: { jobs: FinishedJob[] }) {
  if (jobs.length === 0) return <pre>no finished jobs yet</pre>;
  return (
    <table class="jobs">
      <thead>
        <tr>
          <th>job</th>
          <th>worker</th>
          <th>took</th>
          <th>finished</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <tr>
            <td>#{job.id}</td>
            <td class="dl-key">{job.worker}</td>
            <td>{job.took_ms} ms</td>
            <td>{time(job.finished_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
