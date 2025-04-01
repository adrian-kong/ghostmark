import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, Download, Info, Sparkle, Search } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

interface ParaphrasablePart {
  original: string;
  alternatives: string[];
}

interface Variant {
  user: string;
  token: string;
  message: string;
}

interface ApiResponse {
  template: string;
  paraphrasable_parts: ParaphrasablePart[];
  variants: Variant[];
}

// hacky highlight POC
function highlightDifferences(original: string, variant: string): string {
  const originalWords = original.split(/(\s+)/);
  const variantWords = variant.split(/(\s+)/);
  const isDifferent: boolean[] = new Array(variantWords.length).fill(false);
  if (originalWords.length !== variantWords.length) {
    // Use a greedy approach to match up words
    let origIndex = 0;
    for (let i = 0; i < variantWords.length; i++) {
      if (
        origIndex < originalWords.length &&
        variantWords[i] === originalWords[origIndex]
      ) {
        origIndex++;
      } else {
        const lookAhead = originalWords.indexOf(variantWords[i], origIndex);
        if (lookAhead !== -1) {
          for (let j = i; j < i + (lookAhead - origIndex); j++) {
            if (j < variantWords.length) {
              isDifferent[j] = true;
            }
          }
          origIndex = lookAhead + 1;
        } else {
          isDifferent[i] = true;
        }
      }
    }
  } else {
    for (let i = 0; i < variantWords.length; i++) {
      if (variantWords[i] !== originalWords[i]) {
        isDifferent[i] = true;
      }
    }
  }

  let result = "";
  let inHighlight = false;

  for (let i = 0; i < variantWords.length; i++) {
    if (isDifferent[i] && !inHighlight) {
      result +=
        '<span class="px-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">';
      inHighlight = true;
    } else if (!isDifferent[i] && inHighlight) {
      // End highlight
      result += "</span>";
      inHighlight = false;
    }

    result += variantWords[i];
  }

  // Close any open highlight span
  if (inHighlight) {
    result += "</span>";
  }

  return result;
}

export default function WatermarkGenerator() {
  const [originalText, setOriginalText] = useState("");
  const [numVersions, setNumVersions] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [leakToken, setLeakToken] = useState("");
  const [leakResponse, setLeakResponse] = useState<any>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Call the backend API to generate fingerprinted variants
  const generateFingerprints = async () => {
    if (!originalText) {
      toast.error("Please enter the text you want to watermark.");
      return;
    }

    if (numVersions <= 0 || numVersions > 100) {
      toast.error("Please enter a number between 1 and 100.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/generate-fingerprints",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: originalText, count: numVersions }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setApiResponse(data);

      toast.success(`Created ${data.variants.length} unique versions.`);
    } catch (error) {
      console.error("Error calling API:", error);
      toast.error(
        "Failed to generate fingerprinted texts. Check the console for details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("The fingerprinted text has been copied.");
  };

  // Download all variants as JSON
  const downloadAllVariants = () => {
    if (!apiResponse) return;

    const dataStr = JSON.stringify(apiResponse.variants, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
      dataStr
    )}`;

    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", "fingerprinted-texts.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("All fingerprinted versions downloaded as JSON.");
  };

  // Detect leak source based on token
  const detectLeak = async () => {
    if (!leakToken) {
      toast.error("Please enter a token to detect the leak source.");
      return;
    }

    setIsDetecting(true);

    try {
      const response = await fetch(
        `http://localhost:8000/detect-leak?token=${leakToken}`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setLeakResponse(data);

      toast.success("Leak source detected.");
    } catch (error) {
      console.error("Error detecting leak:", error);
      toast.error(
        "Failed to detect leak source. Check the console for details."
      );
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-screen-lg py-10 px-4">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-row items-center justify-between">
              <CardTitle>Text Fingerprint Generator</CardTitle>

              <div className="flex flex-row items-center gap-2">
                <Label htmlFor="num-versions" className="whitespace-nowrap">
                  Number of Versions
                </Label>
                <Input
                  id="num-versions"
                  type="number"
                  min="1"
                  max="100"
                  value={numVersions}
                  onChange={(e) =>
                    setNumVersions(Number.parseInt(e.target.value) || 5)
                  }
                />
                <Button
                  className="w-fit"
                  onClick={generateFingerprints}
                  disabled={!originalText || isLoading}
                >
                  <Sparkle className="h-4 w-4" />
                  {isLoading ? "Generating..." : "Generate"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter the text you want to fingerprint..."
              className="min-h-[150px]"
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detect Leak Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-end gap-2">
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="leak-token">Token</Label>
                  <Input
                    id="leak-token"
                    placeholder="Paste the fingerprint token here..."
                    value={leakToken}
                    onChange={(e) => setLeakToken(e.target.value)}
                  />
                </div>
                <Button
                  onClick={detectLeak}
                  disabled={!leakToken || isDetecting}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isDetecting ? "Detecting..." : "Detect"}
                </Button>
              </div>

              {leakResponse && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Result</h3>
                  <SyntaxHighlighter language="json" style={atomOneDark}>
                    {JSON.stringify(leakResponse, null, 2)}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {apiResponse && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Fingerprinted Versions</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadAllVariants}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Fingerprinted Text</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiResponse.variants.map((variant, index) => {
                      // Create a highlighted version of the message that shows differences
                      const highlightedMessage = highlightDifferences(
                        originalText,
                        variant.message
                      );

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-mono">
                            {variant.user}
                          </TableCell>
                          <TableCell className="max-w-[500px] whitespace-pre-wrap">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: highlightedMessage,
                              }}
                            />
                          </TableCell>
                          <TableCell className="space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(variant.message)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Text
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(variant.token)}
                            >
                              <Info className="h-4 w-4 mr-2" />
                              Copy Token
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <Toaster />
    </div>
  );
}
