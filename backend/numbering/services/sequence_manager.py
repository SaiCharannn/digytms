from django.db import transaction
from django.core.exceptions import ValidationError
from ..models import NumPatSeq, NumPatMast

class SequenceManager:
    @staticmethod
    @transaction.atomic
    def get_next_sequence(institution_id, num_pat_id, period_key, step=1):
        try:
            pattern = NumPatMast.objects.select_for_update().get(
                institution_id=institution_id,
                num_pat_id=num_pat_id
            )
        except NumPatMast.DoesNotExist:
            raise ValidationError(f"Pattern {num_pat_id} not found")
        
        if pattern.status != 'ACTIVE':
            raise ValidationError(f"Pattern {num_pat_id} is not active")
        
        seq_obj, created = NumPatSeq.objects.select_for_update().get_or_create(
            institution_id=institution_id,
            num_pat_id=num_pat_id,
            period_key=period_key,
            defaults={'last_number': pattern.seq_start - step}
        )
        
        next_number = seq_obj.last_number + step
        
        if next_number > pattern.seq_end:
            raise ValidationError(f"Sequence exceeded maximum value {pattern.seq_end} for period {period_key}")
        
        seq_obj.last_number = next_number
        seq_obj.save()
        return next_number
    
    @staticmethod
    def get_current_sequence(institution_id, num_pat_id, period_key):
        try:
            seq_obj = NumPatSeq.objects.get(
                institution_id=institution_id,
                num_pat_id=num_pat_id,
                period_key=period_key
            )
            return seq_obj.last_number
        except NumPatSeq.DoesNotExist:
            return None