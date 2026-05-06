namespace AdminCore.API.Extensions;

public static class DotEnvExtensions
{
    public static void Load(string filePath = ".env")
    {
        var envPath = FindEnvFile(filePath);
        if (envPath is null)
            return;

        foreach (var line in File.ReadAllLines(envPath))
        {
            var trimmed = line.Trim();

            if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith('#'))
                continue;

            var separatorIndex = trimmed.IndexOf('=');
            if (separatorIndex <= 0)
                continue;

            var key = trimmed[..separatorIndex].Trim();
            var value = trimmed[(separatorIndex + 1)..].Trim();

            if (value.Length >= 2 &&
                ((value.StartsWith('"') && value.EndsWith('"')) ||
                 (value.StartsWith('\'') && value.EndsWith('\''))))
            {
                value = value[1..^1];
            }

            Environment.SetEnvironmentVariable(key, value);
        }
    }

    private static string? FindEnvFile(string fileName)
    {
        var directory = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (directory != null)
        {
            var filePath = Path.Combine(directory.FullName, fileName);
            if (File.Exists(filePath))
                return filePath;
            directory = directory.Parent;
        }
        return null;
    }
}
