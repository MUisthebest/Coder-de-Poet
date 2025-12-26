namespace IdeService.Services
{
    public static class OutputNormalize
    {
        public static string Normalize(string s)
        {
            s = (s ?? "").Replace("\r\n", "\n");
            var lines = s.Split('\n').Select(l => l.TrimEnd(' ', '\t'));
            return string.Join("\n", lines).TrimEnd('\n');
        }

        public static bool Equal(string expected, string got)
            => Normalize(expected) == Normalize(got);

        public static long ParseMaxRssKb(string stderr)
        {
            const string key = "Maximum resident set size (kbytes):";
            foreach (var line in (stderr ?? "").Split('\n'))
            {
                if (!line.Contains(key)) continue;
                var tail = line.Split(key).Last().Trim();
                if (long.TryParse(tail, out var kb)) return kb;
            }
            return 0;
        }
    }
}
