"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import type { InquiryCard, InquiryStage } from "@adminprop/shared-types"
import { Button } from "@adminprop/ui/components/button"
import { Input } from "@adminprop/ui/components/input"
import { Label } from "@adminprop/ui/components/label"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"

import { useInfiniteContracts } from "@/lib/contracts-api"
import { useMoveInquiry } from "@/lib/crm-api"
import {
  LOST_REASONS,
  OTHER_REASON,
  STAGE_LABELS,
  crmApiError,
  neighborsAt,
} from "@/lib/crm"
import { formatDate } from "@/lib/dates"

interface PendingMove {
  card: InquiryCard
  stage: "CLOSED_LOST" | "CLOSED_WON"
  index: number
  beforeId?: string
  afterId?: string
}

/**
 * Mover una consulta de columna. Las etapas comunes se mueven al instante;
 * «Perdida» pide el motivo y «Ganada» ofrece vincular un contrato (DT-99).
 * `request` recibe la tarjeta, la etapa destino y la lista de tarjetas de esa
 * columna (para calcular los vecinos) con el lugar elegido.
 */
export function useMoveFlow() {
  const move = useMoveInquiry()
  const [pending, setPending] = React.useState<PendingMove | null>(null)

  const run = React.useCallback(
    (
      vars: {
        id: string
        stage: InquiryStage
        index: number
        beforeId?: string
        afterId?: string
        lostReason?: string
        contractId?: string
      },
      onDone?: () => void
    ) => {
      move.mutate(vars, {
        onSuccess: onDone,
        onError: (error) =>
          toast.error(crmApiError(error, "No se pudo mover la consulta.")),
      })
    },
    [move]
  )

  const request = React.useCallback(
    (
      card: InquiryCard,
      stage: InquiryStage,
      target: InquiryCard[],
      index: number
    ) => {
      const neighbors = neighborsAt(target, card.id, index)
      if (stage === "CLOSED_LOST" || stage === "CLOSED_WON") {
        if (card.stage !== stage) {
          setPending({ card, stage, index, ...neighbors })
          return
        }
      }
      run({ id: card.id, stage, index, ...neighbors })
    },
    [run]
  )

  const dialogs = (
    <>
      {pending?.stage === "CLOSED_LOST" && (
        <LostDialog
          pending={pending}
          busy={move.isPending}
          onClose={() => setPending(null)}
          onConfirm={(lostReason) => {
            if (!pending) return
            run(
              {
                id: pending.card.id,
                stage: pending.stage,
                index: pending.index,
                ...(pending.beforeId ? { beforeId: pending.beforeId } : {}),
                ...(pending.afterId ? { afterId: pending.afterId } : {}),
                lostReason,
              },
              () => setPending(null)
            )
          }}
        />
      )}
      {pending?.stage === "CLOSED_WON" && (
        <WonDialog
          pending={pending}
          busy={move.isPending}
          onClose={() => setPending(null)}
          onConfirm={(contractId) => {
            if (!pending) return
            run(
              {
                id: pending.card.id,
                stage: pending.stage,
                index: pending.index,
                ...(pending.beforeId ? { beforeId: pending.beforeId } : {}),
                ...(pending.afterId ? { afterId: pending.afterId } : {}),
                ...(contractId ? { contractId } : {}),
              },
              () => setPending(null)
            )
          }}
        />
      )}
    </>
  )

  return { request, dialogs, isMoving: move.isPending }
}

/** Motivo de pérdida: una opción fija o «Otro» con texto libre. */
export function lostReasonValue(choice: string, other: string): string {
  return choice === OTHER_REASON ? other.trim() : choice
}

function LostDialog({
  pending,
  busy,
  onClose,
  onConfirm,
}: {
  pending: PendingMove | null
  busy: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const id = React.useId()
  const [choice, setChoice] = React.useState<string>(LOST_REASONS[0])
  const [other, setOther] = React.useState("")
  const reason = lostReasonValue(choice, other)

  return (
    <ResponsiveDialog
      open={pending !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Marcar como perdida</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {pending?.card.name}: indicá por qué no se concretó.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="grid gap-3 px-4 md:px-0">
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-reason`}>Motivo</Label>
            <Select value={choice} onValueChange={setChoice}>
              <SelectTrigger id={`${id}-reason`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...LOST_REASONS, OTHER_REASON].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {choice === OTHER_REASON && (
            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-other`}>Detalle</Label>
              <Input
                id={`${id}-other`}
                value={other}
                maxLength={200}
                onChange={(event) => setOther(event.target.value)}
              />
            </div>
          )}
        </div>
        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={reason === "" || busy}
            onClick={() => onConfirm(reason)}
          >
            {busy && <Loader2 aria-hidden className="animate-spin" />}
            Marcar como perdida
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

const NO_CONTRACT = "none"

function WonDialog({
  pending,
  busy,
  onClose,
  onConfirm,
}: {
  pending: PendingMove | null
  busy: boolean
  onClose: () => void
  onConfirm: (contractId: string | null) => void
}) {
  const id = React.useId()
  const [contractId, setContractId] = React.useState(NO_CONTRACT)
  const propertyId = pending?.card.property?.id
  const contracts = useInfiniteContracts({
    ...(propertyId ? { propertyId } : {}),
  })
  const options = contracts.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <ResponsiveDialog
      open={pending !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Marcar como ganada</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {pending?.card.name}: si ya existe el contrato, podés vincularlo. Es
            opcional.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="grid gap-1.5 px-4 md:px-0">
          <Label htmlFor={`${id}-contract`}>Contrato (opcional)</Label>
          <Select value={contractId} onValueChange={setContractId}>
            <SelectTrigger id={`${id}-contract`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CONTRACT}>Sin vincular</SelectItem>
              {options.map((contract) => (
                <SelectItem key={contract.id} value={contract.id}>
                  {[
                    contract.property?.address,
                    `desde ${formatDate(contract.startDate)}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={busy}
            onClick={() =>
              onConfirm(contractId === NO_CONTRACT ? null : contractId)
            }
          >
            {busy && <Loader2 aria-hidden className="animate-spin" />}
            Marcar como {STAGE_LABELS.CLOSED_WON.toLowerCase()}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
