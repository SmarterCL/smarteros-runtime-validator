"""
Open-Scouts Adapter para SmarterOS Runtime Validator
Convierte datos de Open-Scouts al formato esperado por /mcp/runtime/ingest
"""
import httpx
import os
from typing import List, Dict, Any
from datetime import datetime


class RuntimeIngestAdapter:
    """Adaptador para enviar datos de Open-Scouts al Runtime Validator"""
    
    def __init__(self, mcp_api_url: str = None):
        self.mcp_api_url = mcp_api_url or os.getenv("MCP_API_URL", "https://api.smarterbot.cl")
        self.ingest_endpoint = f"{self.mcp_api_url}/mcp/runtime/ingest"
    
    async def send_scout_results(
        self,
        tenant_id: str,
        scout_id: str,
        domain: str,
        links: List[Dict[str, Any]],
        urls_new: List[str] = None,
        urls_removed: List[str] = None,
        semantic_changes: List[Dict[str, Any]] = None,
        metadata: Dict[str, Any] = None
    ):
        """
        Envía los resultados del scout al Runtime Validator
        
        Args:
            tenant_id: ID del tenant (RUT o UUID)
            scout_id: ID único del scout
            domain: Dominio escaneado
            links: Lista de enlaces validados con su status
            urls_new: URLs nuevas detectadas
            urls_removed: URLs que desaparecieron
            semantic_changes: Cambios semánticos detectados
            metadata: Metadata adicional
        
        Returns:
            Response del servidor MCP
        """
        
        payload = {
            "tenant_id": tenant_id,
            "scout_id": scout_id,
            "domain": domain,
            "links": self._format_links(links),
            "urls_new": urls_new or [],
            "urls_removed": urls_removed or [],
            "semantic_changes": self._format_semantic_changes(semantic_changes or []),
            "metadata": metadata or {
                "timestamp": datetime.utcnow().isoformat(),
                "adapter_version": "1.0.0"
            }
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self.ingest_endpoint,
                json=payload
            )
            response.raise_for_status()
            return response.json()
    
    def _format_links(self, links: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Formatea los links al esquema esperado por el MCP"""
        formatted = []
        for link in links:
            formatted.append({
                "url": link.get("url"),
                "status_code": link.get("status_code", 200),
                "redirect_target": link.get("redirect_target"),
                "is_external": link.get("is_external", False)
            })
        return formatted
    
    def _format_semantic_changes(self, changes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Formatea los cambios semánticos al esquema esperado"""
        formatted = []
        for change in changes:
            formatted.append({
                "url": change.get("url"),
                "field_name": change.get("field_name"),
                "old_value": change.get("old_value"),
                "new_value": change.get("new_value"),
                "impact_level": change.get("impact_level", "minor")
            })
        return formatted


# Ejemplo de uso en Open-Scouts
async def example_usage():
    """Ejemplo de cómo usar el adapter desde Open-Scouts"""
    
    adapter = RuntimeIngestAdapter()
    
    # Datos simulados de un scout execution
    result = await adapter.send_scout_results(
        tenant_id="76123456-7",
        scout_id="scout-smarterbot-cl",
        domain="smarterbot.cl",
        links=[
            {
                "url": "https://smarterbot.cl/",
                "status_code": 200,
                "is_external": False
            },
            {
                "url": "https://smarterbot.cl/contacto",
                "status_code": 200,
                "is_external": False
            },
            {
                "url": "https://smarterbot.cl/productos",
                "status_code": 404,  # Link roto!
                "is_external": False
            }
        ],
        urls_new=[
            "https://smarterbot.cl/nuevo-producto"
        ],
        semantic_changes=[
            {
                "url": "https://smarterbot.cl/",
                "field_name": "precio_destacado",
                "old_value": "$99.990",
                "new_value": "$79.990",
                "impact_level": "relevant"
            }
        ]
    )
    
    print("✅ Datos enviados al Runtime Validator:", result)


if __name__ == "__main__":
    import asyncio
    asyncio.run(example_usage())
