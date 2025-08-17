export default async function handler(req, res) {
  res.writeHead(302, { Location: "https://embroideryhub.in/" });
  res.end();
}
