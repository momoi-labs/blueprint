import { useState } from "react"
import {
  Button, Combobox, Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger, FormField, type ComboboxOption,
} from "@momoi-labs/kiso-react"

const settings: ComboboxOption[] = [
  ["shared_buffers", "memory", "Memory", "Memory the server uses for shared buffers."],
  ["work_mem", "memory", "Memory", "Memory for each sort or hash before it spills to disk."],
  ["maintenance_work_mem", "memory", "Memory", "Memory for VACUUM, CREATE INDEX, and ALTER TABLE."],
  ["effective_cache_size", "memory", "Memory", "The planner's estimate of the disk cache size."],
  ["huge_pages", "enum", "Memory", "Use huge memory pages: try, on, or off."],
  ["max_connections", "integer", "Connections", "Maximum number of concurrent connections."],
  ["superuser_reserved_connections", "integer", "Connections", "Connection slots kept for superusers."],
  ["idle_in_transaction_session_timeout", "time", "Connections", "End sessions idle in a transaction for longer than this."],
  ["statement_timeout", "time", "Connections", "End any statement that runs longer than this."],
  ["wal_level", "enum", "Write-ahead log", "How much information goes into the WAL."],
  ["max_wal_size", "memory", "Write-ahead log", "WAL size that triggers a checkpoint."],
  ["checkpoint_timeout", "time", "Write-ahead log", "Maximum time between automatic checkpoints."],
  ["synchronous_commit", "enum", "Write-ahead log", "Wait for the WAL flush before a commit reports success."],
  ["max_wal_senders", "integer", "Replication", "Maximum number of WAL sender processes."],
  ["hot_standby_feedback", "boolean", "Replication", "Standbys report their oldest query to the primary."],
  ["wal_keep_size", "memory", "Replication", "WAL kept in pg_wal for standbys."],
  ["random_page_cost", "real", "Planner", "The planner's cost of a page fetched out of order."],
  ["default_statistics_target", "integer", "Planner", "Default sample size for ANALYZE."],
  ["jit", "boolean", "Planner", "Allow JIT compilation of queries."],
  ["autovacuum_naptime", "time", "Autovacuum", "Time between autovacuum runs on one database."],
  ["autovacuum_vacuum_scale_factor", "real", "Autovacuum", "Fraction of the table to change before a vacuum."],
  ["autovacuum_max_workers", "integer", "Autovacuum", "Maximum number of autovacuum worker processes."],
  ["log_min_duration_statement", "time", "Logging", "Log statements that run longer than this."],
  ["log_connections", "boolean", "Logging", "Log each successful connection."],
  ["loop_wait", "time", "Patroni", "Seconds between runs of the Patroni HA loop."],
  ["ttl", "time", "Patroni", "Lifetime of the leader lock in the DCS."],
  ["maximum_lag_on_failover", "memory", "Patroni", "Most lag a replica may have to take part in a failover."],
  ["default_pool_size", "integer", "PgBouncer", "Server connections per user and database pair."],
  ["pool_mode", "enum", "PgBouncer", "When a server connection returns to the pool."],
  ["repo1-retention-full", "integer", "pgBackRest", "Number of full backups to keep."],
].map(([value, note, group, description]) => ({ value, label: value, note, group, description }))

// The pg-yard rule: search the name, the description, and the category.
const settingFilter = (option: ComboboxOption, query: string) => {
  const q = query.trim().toLowerCase()
  return !q || [option.label, option.description, option.group].some(text => text?.toLowerCase().includes(q))
}

function SettingField({ mono = true }: { mono?: boolean }) {
  const [value, setValue] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const error = submitted && !value
    ? query.trim() ? `${query.trim()} is not a setting of this node. Pick one from the list.` : "Pick a setting."
    : undefined
  return <form className="stack" noValidate onSubmit={event => { event.preventDefault(); setSubmitted(true) }}>
    <FormField label="Setting" error={error}
      hint={value ? settings.find(option => option.value === value)?.description : `${settings.length} settings. Search by name, description, or category.`}>
      <Combobox mono={mono} options={settings} filter={settingFilter} value={value} onValueChange={setValue}
        query={query} onQueryChange={setQuery} placeholder="Search by name, description, or category"
        emptyText={q => `No setting matches "${q.trim()}".`} />
    </FormField>
    <div className="demo-row">
      <Button type="submit" variant="primary">Add override</Button>
      <span className="muted t-label" role="status">{value ? `Value: ${value}` : "No setting picked"}</span>
    </div>
  </form>
}

export function ComboboxDemo() {
  const [loading, setLoading] = useState(true)
  return <div className="stack">
    <SettingField />
    <FormField label="Remote list" hint="The product loads the options. The component only shows the state.">
      <Combobox options={loading ? [] : settings.slice(0, 6)} loading={loading} loadingText="Loading settings from the node"
        placeholder="Search settings" controlSize="sm" />
    </FormField>
    <div className="demo-row">
      <Button size="sm" onClick={() => setLoading(!loading)}>{loading ? "Finish loading" : "Load again"}</Button>
      <Dialog>
        <DialogTrigger asChild><Button size="sm">Open in a dialog</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add override</DialogTitle>
            <DialogDescription>The list renders in a portal, so the dialog does not clip it.</DialogDescription>
          </DialogHeader>
          <DialogBody><SettingField /></DialogBody>
          <DialogFooter><DialogClose asChild><Button>Close</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    <FormField label="Unavailable setting">
      <Combobox options={settings} defaultValue="work_mem" disabled />
    </FormField>
  </div>
}
