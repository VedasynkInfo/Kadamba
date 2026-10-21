import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons';
import { Button, Modal, Spinner } from '@/components/ui';
import type { MeasurementProfile } from '@/services/measurements/measurementsService';

interface OrderMeasurementsModalProps {
  open: boolean;
  onClose: () => void;
  availableProfiles: MeasurementProfile[];
  linkedProfileIds: string[];
  loadingProfiles: boolean;
  linkingProfile: boolean;
  onLinkProfile: (id: string) => void;
}

export function OrderMeasurementsModal({
  open,
  onClose,
  availableProfiles,
  linkedProfileIds,
  loadingProfiles,
  linkingProfile,
  onLinkProfile,
}: OrderMeasurementsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Link client measurement profile">
      <div className="space-y-4">
        <p className="text-xs text-ink/65">
          Search or select from the client's recorded measurement profiles. If no profiles exist, you can create one in the Measurements tab.
        </p>

        <div className="max-h-[220px] overflow-y-auto border border-line rounded-sm divide-y divide-black/5">
          {loadingProfiles ? (
            <div className="py-8 text-center">
              <Spinner size="sm" />
            </div>
          ) : availableProfiles.length === 0 ? (
            <div className="py-6 text-center text-xs text-ink/70">
              No profiles recorded for this customer.
              <Link
                to="/admin/measurements"
                className="block font-semibold text-ink hover:underline mt-2 text-[10px] uppercase"
              >
                Create fitting profile <Icon name="arrowRight" size={14} className="mr-1 inline align-middle" /> 
              </Link>
            </div>
          ) : (
            availableProfiles.map((p) => {
              const isLinked = linkedProfileIds.includes(p.id);
              return (
                <div key={p.id} className="flex justify-between items-center p-3 text-xs">
                  <div>
                    <span className="font-semibold block">
                      {p.profileName} ({p.productTypeCode})
                    </span>
                    <span className="text-ink/55 text-[10px] block mt-0.5">
                      Updated: {new Date(p.measuredAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={isLinked ? 'secondary' : 'primary'}
                    disabled={linkingProfile}
                    onClick={() => onLinkProfile(p.id)}
                  >
                    {isLinked ? 'Unlink' : 'Link'}
                  </Button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-line">
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
