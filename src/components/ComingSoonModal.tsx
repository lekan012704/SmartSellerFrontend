import { Globe, Sparkles, Rocket } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

/**
 * Animated "Coming Soon" modal shown when the user picks Global Logistics.
 * Uses keyframes defined in index.css (pulse-glow, float, slide-up).
 */
const ComingSoonModal = ({ open, onOpenChange }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md overflow-hidden">
      <DialogHeader className="sr-only">
        <DialogTitle>Global Logistics — Coming Soon</DialogTitle>
        <DialogDescription>This integration is not available yet.</DialogDescription>
      </DialogHeader>

      <div className="relative text-center py-6 px-2">
        {/* Animated background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full gradient-primary opacity-20 blur-3xl animate-coming-blob" />
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full gradient-accent opacity-20 blur-3xl animate-coming-blob" style={{ animationDelay: "1.2s" }} />
        </div>

        <div className="relative">
          <div className="mx-auto h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center shadow-glow animate-float">
            <Globe className="h-10 w-10 text-primary-foreground" />
          </div>

          <div className="mt-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold animate-pulse-glow">
            <Sparkles className="h-3 w-3" />
            COMING SOON
          </div>

          <h2 className="font-display text-2xl font-bold mt-4 animate-slide-up">
            Global Logistics is on the way
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
            We're integrating premium courier partners — DHL, FedEx, UPS and more — so you can ship anywhere in the world with one click.
          </p>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            {[
              { icon: Rocket, label: "Fast pickup" },
              { icon: Globe, label: "Worldwide" },
              { icon: Sparkles, label: "Live tracking" },
            ].map((f, i) => (
              <div key={f.label} className="flex flex-col items-center gap-1 animate-slide-up" style={{ animationDelay: `${0.2 + i * 0.08}s` }}>
                <f.icon className="h-4 w-4 text-primary" />
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button onClick={() => onOpenChange(false)} className="w-full gradient-primary text-primary-foreground border-0">
          Got it
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ComingSoonModal;
