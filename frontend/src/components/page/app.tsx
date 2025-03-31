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
import { Copy, Download, Info } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

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

export default function WatermarkGenerator() {
  const [originalText, setOriginalText] = useState("");
  const [numVersions, setNumVersions] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: originalText,
            count: numVersions,
          }),
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

  return (
    <div className="container mx-auto max-w-screen-lg py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Text Fingerprint Generator</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Original Text</CardTitle>
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
            <CardTitle>Generation Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="num-versions">Number of Versions</Label>
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
                </div>

                <div className="flex items-end">
                  <Button
                    className="w-full"
                    onClick={generateFingerprints}
                    disabled={!originalText || isLoading}
                  >
                    {isLoading
                      ? "Generating..."
                      : "Generate Fingerprinted Versions"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {apiResponse && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Template & Paraphrasable Parts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Template Pattern
                    </h3>
                    <div className="p-3 bg-muted rounded-md font-mono text-sm">
                      {apiResponse.template}
                    </div>
                  </div>

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="paraphrasable-parts">
                      <AccordionTrigger>
                        Paraphrasable Parts (
                        {apiResponse.paraphrasable_parts.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 mt-2">
                          {apiResponse.paraphrasable_parts.map(
                            (part, index) => (
                              <div
                                key={index}
                                className="border rounded-md p-3"
                              >
                                <div className="font-medium mb-2">
                                  Original:{" "}
                                  <span className="font-normal">
                                    {part.original}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm text-muted-foreground mb-1">
                                    Alternatives:
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {part.alternatives.map((alt, altIndex) => (
                                      <Badge key={altIndex} variant="outline">
                                        {alt}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </CardContent>
            </Card>

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
                    {apiResponse.variants.map((variant, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">
                          {variant.user}
                        </TableCell>
                        <TableCell className="max-w-[500px]">
                          {variant.message}
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
                    ))}
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
