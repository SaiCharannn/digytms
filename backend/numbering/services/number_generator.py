from django.db import transaction
from django.core.exceptions import ValidationError
from ..models import NumPatDetails, NumPatMast, NumGenLog
from .token_processor import TokenProcessor
from .sequence_manager import SequenceManager

class NumberGenerator:
    @staticmethod
    def generate(institution_id, num_pat_id, context=None):
        if context is None:
            context = {}
        
        try:
            pattern_master = NumPatMast.objects.get(
                institution_id=institution_id,
                num_pat_id=num_pat_id,
                status='ACTIVE'
            )
        except NumPatMast.DoesNotExist:
            raise ValidationError(f"Active pattern {num_pat_id} not found")
        
        tokens = NumPatDetails.objects.filter(
            institution_id=institution_id,
            num_pat_id=num_pat_id,
            num_pat_status='ACTIVE'
        ).order_by('token_order')
        
        if not tokens.exists():
            raise ValidationError(f"No token configuration found for pattern {num_pat_id}")
        
        token_list = list(tokens.values())
        TokenProcessor.validate_pattern_tokens(token_list)
        
        seq_token = next((t for t in token_list if t['token_id'] == 'SEQ'), None)
        period_key = TokenProcessor.get_period_key(seq_token['reset_policy'])
        
        try:
            sequence_number = SequenceManager.get_next_sequence(
                institution_id=institution_id,
                num_pat_id=num_pat_id,
                period_key=period_key,
                step=pattern_master.seq_step
            )
        except Exception as e:
            raise ValidationError(f"Failed to get sequence: {str(e)}")
        
        generated_parts = []
        for token in token_list:
            token_value = TokenProcessor.process_token(
                token, context, 
                sequence_number if token['token_id'] == 'SEQ' else None
            )
            generated_parts.append(token_value)
        
        generated_number = ''.join(generated_parts)
        
        NumGenLog.objects.create(
            institution_id=institution_id,
            num_pat_id=num_pat_id,
            generated_number=generated_number,
            period_key=period_key,
            context_data=context,
            generated_by=context.get('generated_by')
        )
        
        return {
            'generated_number': generated_number,
            'sequence_number': sequence_number,
            'period_key': period_key
        }
    
    @staticmethod
    def preview(institution_id, num_pat_id, context=None):
        if context is None:
            context = {}
        
        try:
            pattern_master = NumPatMast.objects.get(
                institution_id=institution_id,
                num_pat_id=num_pat_id
            )
        except NumPatMast.DoesNotExist:
            raise ValidationError(f"Pattern {num_pat_id} not found")
        
        tokens = NumPatDetails.objects.filter(
            institution_id=institution_id,
            num_pat_id=num_pat_id
        ).order_by('token_order')
        
        if not tokens.exists():
            raise ValidationError(f"No token configuration found for pattern {num_pat_id}")
        
        token_list = list(tokens.values())
        
        seq_token = next((t for t in token_list if t['token_id'] == 'SEQ'), None)
        if seq_token:
            period_key = TokenProcessor.get_period_key(seq_token['reset_policy'])
            current_seq = SequenceManager.get_current_sequence(
                institution_id=institution_id,
                num_pat_id=num_pat_id,
                period_key=period_key
            )
            next_seq = (current_seq or pattern_master.seq_start - pattern_master.seq_step) + pattern_master.seq_step
        else:
            next_seq = None
            period_key = None
        
        generated_parts = []
        for token in token_list:
            token_value = TokenProcessor.process_token(
                token, context,
                next_seq if token['token_id'] == 'SEQ' else None
            )
            generated_parts.append(token_value)
        
        return {
            'preview_number': ''.join(generated_parts),
            'next_sequence': next_seq,
            'period_key': period_key
        }