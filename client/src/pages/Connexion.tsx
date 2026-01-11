import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, ArrowLeft, Shield, Loader2 } from "lucide-react";
import Header from "@/components/Header";

export default function Connexion() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"input" | "verify">("input");
  const [authType, setAuthType] = useState<"email" | "sms">("email");
  const [identifier, setIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const { data: smsAvailable } = useQuery<{ available: boolean }>({
    queryKey: ["/api/auth/check-sms-availability"],
  });

  const sendOtpMutation = useMutation({
    mutationFn: async (data: { identifier: string; type: string }) => {
      const response = await apiRequest("POST", "/api/auth/send-otp", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setStep("verify");
        toast({
          title: "Code envoyé",
          description: authType === "email" 
            ? "Vérifiez votre boîte mail" 
            : "Vérifiez vos SMS",
        });
      } else {
        toast({
          title: "Erreur",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le code",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { identifier: string; code: string; type: string }) => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.setQueryData(["/api/auth/user"], data.user);
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur Burkina Secure",
        });
        setTimeout(() => navigate("/"), 100);
      } else {
        toast({
          title: "Code incorrect",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur de vérification",
        variant: "destructive",
      });
    },
  });

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast({
        title: "Champ requis",
        description: authType === "email" ? "Entrez votre email" : "Entrez votre numéro",
        variant: "destructive",
      });
      return;
    }
    sendOtpMutation.mutate({ identifier: identifier.trim(), type: authType });
  };

  const handleVerifyOtp = () => {
    if (otpCode.length !== 6) {
      toast({
        title: "Code incomplet",
        description: "Entrez les 6 chiffres du code",
        variant: "destructive",
      });
      return;
    }
    verifyOtpMutation.mutate({ 
      identifier: identifier.trim(), 
      code: otpCode, 
      type: authType 
    });
  };

  useEffect(() => {
    if (otpCode.length === 6) {
      handleVerifyOtp();
    }
  }, [otpCode]);

  const resetForm = () => {
    setStep("input");
    setOtpCode("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showNotifications={false} />
      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Burkina Secure</CardTitle>
            <CardDescription>
              {step === "input" 
                ? "Connectez-vous avec votre email ou téléphone" 
                : "Entrez le code de vérification"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "input" ? (
              <Tabs value={authType} onValueChange={(v) => setAuthType(v as "email" | "sms")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="email" className="flex items-center gap-2" data-testid="tab-email">
                    <Mail className="w-4 h-4" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sms" 
                    className="flex items-center gap-2"
                    disabled={!smsAvailable?.available}
                    data-testid="tab-sms"
                  >
                    <Phone className="w-4 h-4" />
                    SMS
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={handleSendOtp}>
                  <TabsContent value="email" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Adresse email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        data-testid="input-email"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="sms" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Numéro de téléphone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+226 XX XX XX XX"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        data-testid="input-phone"
                      />
                      <p className="text-xs text-muted-foreground">
                        Format: +226 suivi de votre numéro
                      </p>
                    </div>
                  </TabsContent>

                  <Button 
                    type="submit" 
                    className="w-full mt-4"
                    disabled={sendOtpMutation.isPending}
                    data-testid="button-send-otp"
                  >
                    {sendOtpMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      "Recevoir le code"
                    )}
                  </Button>
                </form>

                {!smsAvailable?.available && (
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    L'authentification par SMS n'est pas encore disponible
                  </p>
                )}
              </Tabs>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Code envoyé à
                  </p>
                  <p className="font-medium">{identifier}</p>
                </div>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={setOtpCode}
                    data-testid="input-otp"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerifyOtp}
                  className="w-full"
                  disabled={verifyOtpMutation.isPending || otpCode.length !== 6}
                  data-testid="button-verify-otp"
                >
                  {verifyOtpMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    "Vérifier"
                  )}
                </Button>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => sendOtpMutation.mutate({ identifier, type: authType })}
                    disabled={sendOtpMutation.isPending}
                    className="text-sm"
                    data-testid="button-resend-otp"
                  >
                    Renvoyer le code
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={resetForm}
                    className="text-sm"
                    data-testid="button-back"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Modifier l'identifiant
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
