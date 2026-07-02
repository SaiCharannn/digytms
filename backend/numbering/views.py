from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.db import transaction
from django.utils import timezone
from datetime import datetime
import logging
from .models import NumPatMast, NumPatDetails, NumPatSeq, NumGenLog
from .serializers import (
    NumPatMastSerializer,
    NumPatMastCreateSerializer,
    NumPatDetailsSerializer,
    NumPatDetailsCreateSerializer,
    NumPatSeqSerializer,
    NumGenLogSerializer
)

logger = logging.getLogger(__name__)


class NumPatMastViewSet(viewsets.ModelViewSet):
    """ViewSet for Numbering Pattern Master"""
    queryset = NumPatMast.objects.exclude(status='DELETED')
    permission_classes = [AllowAny]
    lookup_field = 'num_pat_id'
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NumPatMastCreateSerializer
        return NumPatMastSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        institution_id = self.request.query_params.get('institution_id')
        if institution_id:
            queryset = queryset.filter(institution_id=institution_id)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_datetime')
    
    def create(self, request, *args, **kwargs):
        serializer = NumPatMastCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            data = serializer.validated_data
            
            # Check if pattern already exists
            if NumPatMast.objects.filter(num_pat_id=data['num_pat_id'].upper()).exists():
                return Response({
                    'success': False,
                    'error': f"Pattern ID '{data['num_pat_id']}' already exists"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            pattern = NumPatMast.objects.create(
                institution_id=data['institution_id'],
                num_pat_id=data['num_pat_id'].upper(),
                pattern_name=data['pattern_name'],
                remarks=data.get('remarks', ''),
                seq_start=data['seq_start'],
                seq_end=data['seq_end'],
                seq_step=data.get('seq_step', 1),
                status=data.get('status', 'ACTIVE'),
                created_by=data.get('created_by')
            )
            
            return Response({
                'success': True,
                'message': 'Pattern created successfully',
                'data': NumPatMastSerializer(pattern).data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, *args, **kwargs):
        pattern = self.get_object()
        serializer = NumPatMastSerializer(pattern, data=request.data, partial=True)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response({
                'success': True,
                'message': 'Pattern updated successfully',
                'data': serializer.data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, *args, **kwargs):
        pattern = self.get_object()
        pattern.status = 'DELETED'
        pattern.save()
        return Response({
            'success': True,
            'message': 'Pattern deleted successfully'
        }, status=status.HTTP_200_OK)


class NumPatDetailsViewSet(viewsets.ModelViewSet):
    """ViewSet for Numbering Pattern Details (Tokens)"""
    queryset = NumPatDetails.objects.all()
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NumPatDetailsCreateSerializer
        return NumPatDetailsSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        num_pat_id = self.request.query_params.get('num_pat_id')
        if num_pat_id:
            queryset = queryset.filter(num_pat_id=num_pat_id)
        return queryset.order_by('token_order')
    
    def create(self, request, *args, **kwargs):
        serializer = NumPatDetailsCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            data = serializer.validated_data
            
            # Check if pattern exists
            if not NumPatMast.objects.filter(num_pat_id=data['num_pat_id']).exists():
                return Response({
                    'success': False,
                    'error': f"Pattern '{data['num_pat_id']}' not found"
                }, status=status.HTTP_404_NOT_FOUND)
            
            detail = NumPatDetails.objects.create(
                institution_id=data['institution_id'],
                num_pat_id=data['num_pat_id'],
                token_order=data['token_order'],
                token_id=data['token_id'],
                token_value=data.get('token_value'),
                seq_length=data.get('seq_length'),
                reset_policy=data.get('reset_policy'),
                num_pat_status=data.get('num_pat_status', 'ACTIVE'),
                created_by=data.get('created_by')
            )
            
            return Response({
                'success': True,
                'message': 'Token added successfully',
                'data': NumPatDetailsSerializer(detail).data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, *args, **kwargs):
        detail = self.get_object()
        detail.delete()
        return Response({
            'success': True,
            'message': 'Token deleted successfully'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Reorder tokens for a pattern"""
        num_pat_id = request.data.get('num_pat_id')
        orders = request.data.get('orders', [])
        
        try:
            with transaction.atomic():
                for order_info in orders:
                    token_id = order_info.get('id')
                    token_order = order_info.get('token_order')
                    NumPatDetails.objects.filter(id=token_id, num_pat_id=num_pat_id).update(token_order=token_order)
            return Response({
                'success': True,
                'message': 'Tokens reordered successfully'
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerateNumberView(APIView):
    """Generate a number based on pattern"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        institution_id = request.data.get('institution_id')
        pattern_id = request.data.get('pattern_id', '').upper()
        context = request.data.get('context', {})
        
        if not institution_id or not pattern_id:
            return Response({
                'success': False,
                'error': 'institution_id and pattern_id are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            pattern = NumPatMast.objects.get(
                num_pat_id=pattern_id,
                institution_id=institution_id,
                status='ACTIVE'
            )
            
            tokens = NumPatDetails.objects.filter(
                num_pat_id=pattern_id,
                num_pat_status='ACTIVE'
            ).order_by('token_order')
            
            if not tokens.exists():
                return Response({
                    'success': False,
                    'error': 'No tokens configured for this pattern'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            now = datetime.now()
            period_key = f"{now.year}{now.month:02d}"
            
            seq_record, _ = NumPatSeq.objects.get_or_create(
                institution_id=institution_id,
                num_pat_id=pattern_id,
                period_key=period_key,
                defaults={'last_number': pattern.seq_start - pattern.seq_step}
            )
            
            next_number = seq_record.last_number + pattern.seq_step
            
            if next_number > pattern.seq_end:
                return Response({
                    'success': False,
                    'error': 'Sequence limit reached'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Build the generated number
            generated_parts = []
            
            for token in tokens:
                if token.token_id == 'PREFIX':
                    generated_parts.append(token.token_value or '')
                elif token.token_id == 'SUFFIX':
                    generated_parts.append(token.token_value or '')
                elif token.token_id == 'SEQ':
                    seq_length = token.seq_length or 5
                    generated_parts.append(str(next_number).zfill(seq_length))
                elif token.token_id == 'YYYY':
                    generated_parts.append(str(now.year))
                elif token.token_id == 'YY':
                    generated_parts.append(str(now.year)[-2:])
                elif token.token_id == 'MM':
                    generated_parts.append(f"{now.month:02d}")
                elif token.token_id == 'DD':
                    generated_parts.append(f"{now.day:02d}")
                elif token.token_id == 'FY':
                    fy_start = now.year if now.month >= 4 else now.year - 1
                    generated_parts.append(f"{fy_start % 100:02d}-{(fy_start + 1) % 100:02d}")
                elif token.token_id == 'STATIC':
                    generated_parts.append(token.token_value or '')
                elif token.token_id == 'BRANCH':
                    generated_parts.append(context.get('branch', 'XX'))
                elif token.token_id == 'PRODUCT':
                    generated_parts.append(context.get('product', 'XX'))
            
            generated_number = ''.join(generated_parts)
            
            # Update sequence
            seq_record.last_number = next_number
            seq_record.save()
            
            # Log generation
            NumGenLog.objects.create(
                institution_id=institution_id,
                num_pat_id=pattern_id,
                generated_number=generated_number,
                period_key=period_key,
                context_data=context
            )
            
            return Response({
                'success': True,
                'generated_number': generated_number,
                'sequence_number': next_number,
                'period_key': period_key,
                'pattern_id': pattern_id
            })
            
        except NumPatMast.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Pattern not found or inactive'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SequenceView(APIView):
    """Get sequence information for a pattern"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        institution_id = request.query_params.get('institution_id')
        pattern_id = request.query_params.get('pattern_id', '').upper()
        
        if not institution_id or not pattern_id:
            return Response({
                'success': False,
                'error': 'institution_id and pattern_id are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            pattern = NumPatMast.objects.get(
                num_pat_id=pattern_id,
                institution_id=institution_id
            )
            
            now = datetime.now()
            period_key = f"{now.year}{now.month:02d}"
            
            seq_record = NumPatSeq.objects.filter(
                institution_id=institution_id,
                num_pat_id=pattern_id,
                period_key=period_key
            ).first()
            
            current_number = seq_record.last_number + pattern.seq_step if seq_record else pattern.seq_start
            
            return Response({
                'success': True,
                'data': {
                    'num_pat_id': pattern.num_pat_id,
                    'pattern_name': pattern.pattern_name,
                    'seq_start': pattern.seq_start,
                    'seq_end': pattern.seq_end,
                    'seq_step': pattern.seq_step,
                    'current_number': current_number,
                    'remaining': pattern.seq_end - current_number + 1,
                    'period_key': period_key,
                    'status': pattern.status
                }
            })
            
        except NumPatMast.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Pattern not found'
            }, status=status.HTTP_404_NOT_FOUND)


class GenerationLogView(APIView):
    """Get generation logs for a pattern"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        institution_id = request.query_params.get('institution_id')
        pattern_id = request.query_params.get('pattern_id', '').upper()
        limit = int(request.query_params.get('limit', 50))
        
        if not institution_id or not pattern_id:
            return Response({
                'success': False,
                'error': 'institution_id and pattern_id are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logs = NumGenLog.objects.filter(
            institution_id=institution_id,
            num_pat_id=pattern_id
        ).order_by('-generated_datetime')[:limit]
        
        return Response({
            'success': True,
            'data': NumGenLogSerializer(logs, many=True).data,
            'count': logs.count()
        })