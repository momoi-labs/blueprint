// In-memory fixtures only. No requests to the real Self Host Platform.
export type Application = {
  id: string;
  name: string;
  hostname: string;
  image: string;
  aliases: string;
  status: "running" | "stopped" | "failed";
  restarts: number;
  source: "image" | "compose";
  compose: string;
  logs: string[];
};

export function initialApplications(): Application[] {
  return [
    {
      id: "hermes",
      name: "hermes",
      hostname: "hermes.home.lan",
      image: "nousresearch/hermes-agent:latest",
      aliases: "",
      status: "running",
      restarts: 0,
      source: "image",
      compose: "",
      logs: [
        "2026/09/06 14:10:02 [info] Starting Hermes agent",
        "2026/09/06 14:10:03 [info] Configuration loaded",
        "2026/09/06 14:10:03 [info] Listening on 0.0.0.0:80",
        "2026/09/06 14:10:04 [info] Ready to accept requests",
      ],
    },
    {
      id: "teste",
      name: "teste",
      hostname: "teste.home.lan",
      image: "nginx",
      aliases: "",
      status: "running",
      restarts: 0,
      source: "image",
      compose: "",
      logs: [
        "2026/09/06 14:14:46 [notice] nginx/1.28.0",
        "2026/09/06 14:14:46 [notice] using the epoll event method",
        ...Array.from(
          { length: 22 },
          (_, i) =>
            `2026/09/06 14:14:47 [notice] 1#1: start worker process ${28 + i}`,
        ),
        '172.19.0.2 - - [06/Sep/2026:14:16:37 +0000] "GET / HTTP/1.1" 200 896',
        "2026/09/06 14:16:38 [info] keepalive connection ready",
      ],
    },
  ];
}

export const platformServices = [
  {
    name: "traefik",
    role: "HTTP routing",
    hostname: "Host :80 / :443",
    image: "traefik:v3.5",
  },
  {
    name: "dnsmasq",
    role: "LAN DNS",
    hostname: "Host :53",
    image: "dnsmasq:2.91",
  },
  {
    name: "postgres",
    role: "Platform state",
    hostname: "Internal network",
    image: "postgres:18",
  },
];
